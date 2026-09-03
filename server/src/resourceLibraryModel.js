import { pool } from "./db.js";

const slugify = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);

const isValidDate = (value) => value instanceof Date && !isNaN(value.getTime());

const mapCategoryRow = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || "",
  icon: row.icon || "",
  accentColor: row.accent_color || "",
  resourceCount: Number(row.resource_count || 0),
  isFeatured: Boolean(row.is_featured),
  isActive: Boolean(row.is_active),
  displayOrder: Number(row.display_order || 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapResourceRow = (row) => ({
  id: row.id,
  categoryId: row.category_id,
  category: row.category_id
    ? {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug
      }
    : null,
  title: row.title,
  description: row.description || "",
  summary: row.summary || "",
  fileName: row.file_name || "",
  fileUrl: row.file_url || "",
  filePath: row.file_path || "",
  fileExtension: row.file_extension || "",
  mimeType: row.mime_type || "",
  fileSize: Number(row.file_size || 0),
  storageProvider: row.storage_provider || "local",
  downloadCount: Number(row.download_count || 0),
  isFeatured: Boolean(row.is_featured),
  isPublished: Boolean(row.is_published),
  allowDownloads: Boolean(row.allow_downloads),
  coverImageUrl: row.cover_image_url || "",
  previewUrl: row.preview_url || "",
  externalUrl: row.external_url || "",
  resourceType: row.resource_type || row.file_extension || "",
  tags: Array.isArray(row.tags) ? row.tags : [],
  sortOrder: Number(row.sort_order || 0),
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const defaultCategories = [
  {
    name: "Policy & Regulations",
    description: "Latest policy briefs, regulations, and compliance checklists",
    icon: "scale",
    accent_color: "#0f766e",
    display_order: 1
  },
  {
    name: "Technical Guides",
    description: "Installation manuals, standards, and technical playbooks",
    icon: "settings",
    accent_color: "#2563eb",
    display_order: 2
  },
  {
    name: "Business & Finance",
    description: "Financing guides, business cases, and investment decks",
    icon: "coins",
    accent_color: "#ea580c",
    display_order: 3
  },
  {
    name: "Training & Toolkits",
    description: "Curriculum, facilitator toolkits, and learning modules",
    icon: "graduation-cap",
    accent_color: "#7c3aed",
    display_order: 4
  },
  {
    name: "Impact & Research",
    description: "Impact stories, research studies, and data insights",
    icon: "activity",
    accent_color: "#16a34a",
    display_order: 5
  }
];

const normalizeTags = (value) => {
  let tags = [];

  if (Array.isArray(value)) {
    tags = [...new Set(value.map((item) => `${item || ""}`.trim()).filter(Boolean))];
  } else if (typeof value === "string") {
    tags = value
      .split(/,|\n/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return tags.length ? tags : [];
};

const coerceBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = `${value}`.toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
};

const parseInteger = (value, fallback = 0) => {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
};

const ensureUniqueSlug = async (name, preferredSlug) => {
  const baseSlug = preferredSlug || slugify(name) || `category-${Date.now()}`;
  let slug = baseSlug;
  let attempt = 1;

  while (attempt < 10) {
    const existing = await pool.query(
      "SELECT 1 FROM resource_library_categories WHERE slug = $1",
      [slug]
    );

    if (existing.rowCount === 0) {
      return slug;
    }

    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  return `${baseSlug}-${Date.now()}`;
};

export const ensureDefaultCategories = async () => {
  const existing = await pool.query("SELECT slug FROM resource_library_categories LIMIT 1");

  if (existing.rowCount > 0) {
    return;
  }

  for (const category of defaultCategories) {
    const slug = await ensureUniqueSlug(category.name, slugify(category.name));

    await pool.query(
      `
        INSERT INTO resource_library_categories (
          name,
          slug,
          description,
          icon,
          accent_color,
          display_order,
          is_active,
          is_featured
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, $7)
      `,
      [
        category.name,
        slug,
        category.description,
        category.icon,
        category.accent_color,
        category.display_order,
        category.display_order === 1
      ]
    );
  }
};

const refreshCategoryCount = async (categoryId) => {
  if (!categoryId) {
    return;
  }

  await pool.query(
    `
      UPDATE resource_library_categories
      SET
        resource_count = (
          SELECT COUNT(*)
          FROM resource_library_resources
          WHERE category_id = $1
            AND is_published = true
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [categoryId]
  );
};

export const listCategories = async ({ includeInactive = false } = {}) => {
  const whereClause = includeInactive ? "" : "WHERE is_active = true";
  const result = await pool.query(
    `
      SELECT *
      FROM resource_library_categories
      ${whereClause}
      ORDER BY display_order ASC, name ASC
    `
  );

  return result.rows.map(mapCategoryRow);
};

export const createCategory = async (payload) => {
  const slug = await ensureUniqueSlug(payload.name, slugify(payload.slug || payload.name));
  const result = await pool.query(
    `
      INSERT INTO resource_library_categories (
        name,
        slug,
        description,
        icon,
        accent_color,
        is_featured,
        is_active,
        display_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      payload.name,
      slug,
      payload.description || "",
      payload.icon || "",
      payload.accentColor || "",
      coerceBoolean(payload.isFeatured, false),
      coerceBoolean(payload.isActive, true),
      parseInteger(payload.displayOrder, 0)
    ]
  );

  return mapCategoryRow(result.rows[0]);
};

export const updateCategory = async (id, payload) => {
  const fields = [];
  const values = [];

  if (payload.name) {
    fields.push("name = $" + (fields.length + 1));
    values.push(payload.name);
  }

  if (payload.slug) {
    fields.push("slug = $" + (fields.length + 1));
    values.push(await ensureUniqueSlug(payload.name || "", slugify(payload.slug)));
  }

  if (payload.description !== undefined) {
    fields.push("description = $" + (fields.length + 1));
    values.push(payload.description || "");
  }

  if (payload.icon !== undefined) {
    fields.push("icon = $" + (fields.length + 1));
    values.push(payload.icon || "");
  }

  if (payload.accentColor !== undefined) {
    fields.push("accent_color = $" + (fields.length + 1));
    values.push(payload.accentColor || "");
  }

  if (payload.isFeatured !== undefined) {
    fields.push("is_featured = $" + (fields.length + 1));
    values.push(coerceBoolean(payload.isFeatured));
  }

  if (payload.isActive !== undefined) {
    fields.push("is_active = $" + (fields.length + 1));
    values.push(coerceBoolean(payload.isActive));
  }

  if (payload.displayOrder !== undefined) {
    fields.push("display_order = $" + (fields.length + 1));
    values.push(parseInteger(payload.displayOrder, 0));
  }

  if (!fields.length) {
    const existing = await pool.query("SELECT * FROM resource_library_categories WHERE id = $1", [id]);
    if (!existing.rowCount) {
      return null;
    }
    return mapCategoryRow(existing.rows[0]);
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  const idPlaceholder = values.length + 1;
  const query = `
    UPDATE resource_library_categories
    SET ${fields.join(", ")}
    WHERE id = $${idPlaceholder}
    RETURNING *
  `;
  const result = await pool.query(query, [...values, id]);

  if (!result.rowCount) {
    return null;
  }

  return mapCategoryRow(result.rows[0]);
};

export const deleteCategory = async (id) => {
  const result = await pool.query(
    "DELETE FROM resource_library_categories WHERE id = $1 RETURNING *",
    [id]
  );

  return result.rowCount > 0;
};

const buildResourceFilters = ({
  search,
  category,
  featuredOnly,
  tags,
  fileTypes,
  includeDrafts,
  allowedStatuses
}) => {
  const where = [];
  const values = [];

  if (!includeDrafts) {
    where.push("r.is_published = true");
  } else if (Array.isArray(allowedStatuses) && allowedStatuses.length) {
    where.push(`r.is_published = ANY($${values.length + 1}::BOOLEAN[])`);
    values.push(allowedStatuses);
  }

  if (category) {
    where.push("(c.slug = $" + (values.length + 1) + " OR c.id::text = $" + (values.length + 1) + ")");
    values.push(category);
  }

  if (featuredOnly) {
    where.push("r.is_featured = true");
  }

  if (search) {
    const term = `%${search.toLowerCase()}%`;
    where.push(
      `(
        LOWER(r.title) LIKE $${values.length + 1}
        OR LOWER(r.description) LIKE $${values.length + 1}
        OR LOWER(r.summary) LIKE $${values.length + 1}
        OR EXISTS (
          SELECT 1 FROM unnest(r.tags) AS tag WHERE LOWER(tag) LIKE $${values.length + 1}
        )
      )`
    );
    values.push(term);
  }

  if (Array.isArray(tags) && tags.length) {
    where.push(`r.tags && $${values.length + 1}::text[]`);
    values.push(tags);
  }

  if (Array.isArray(fileTypes) && fileTypes.length) {
    where.push(`(r.resource_type = ANY($${values.length + 1}) OR r.file_extension = ANY($${values.length + 1}))`);
    values.push(fileTypes);
  }

  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", values };
};

const buildSortClause = (sort = "newest") => {
  switch (sort) {
    case "oldest":
      return "ORDER BY r.published_at ASC NULLS LAST, r.created_at ASC";
    case "popular":
      return "ORDER BY r.download_count DESC, r.created_at DESC";
    case "featured":
      return "ORDER BY r.is_featured DESC, r.sort_order ASC, r.created_at DESC";
    case "alpha":
      return "ORDER BY r.title ASC";
    default:
      return "ORDER BY r.published_at DESC NULLS LAST, r.created_at DESC";
  }
};

export const listResources = async ({
  page = 1,
  limit = 12,
  search,
  category,
  featuredOnly = false,
  tags,
  fileTypes,
  sort,
  includeDrafts = false
} = {}) => {
  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 12));
  const offset = (normalizedPage - 1) * normalizedLimit;
  const { where, values } = buildResourceFilters({ search, category, featuredOnly, tags, fileTypes, includeDrafts });
  const sortClause = buildSortClause(sort);

  const baseQuery = `
    FROM resource_library_resources r
    LEFT JOIN resource_library_categories c ON c.id = r.category_id
    ${where}
  `;

  const totalResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, values);
  const total = Number(totalResult.rows[0]?.count || 0);

  const rowsResult = await pool.query(
    `
      SELECT r.*, c.name AS category_name, c.slug AS category_slug
      ${baseQuery}
      ${sortClause}
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `,
    [...values, normalizedLimit, offset]
  );

  return {
    page: normalizedPage,
    total,
    pageSize: normalizedLimit,
    totalPages: Math.max(1, Math.ceil(total / normalizedLimit)),
    resources: rowsResult.rows.map(mapResourceRow)
  };
};

export const getResourceById = async (id) => {
  const result = await pool.query(
    `
      SELECT r.*, c.name AS category_name, c.slug AS category_slug
      FROM resource_library_resources r
      LEFT JOIN resource_library_categories c ON c.id = r.category_id
      WHERE r.id = $1
    `,
    [id]
  );

  if (!result.rowCount) {
    return null;
  }

  return mapResourceRow(result.rows[0]);
};

export const createResource = async (payload) => {
  const result = await pool.query(
    `
      INSERT INTO resource_library_resources (
        category_id,
        title,
        description,
        summary,
        file_name,
        file_url,
        file_path,
        file_extension,
        mime_type,
        file_size,
        storage_provider,
        is_featured,
        is_published,
        allow_downloads,
        cover_image_url,
        preview_url,
        external_url,
        resource_type,
        tags,
        sort_order,
        published_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19::text[], $20, $21
      )
      RETURNING *
    `,
    [
      payload.categoryId || null,
      payload.title,
      payload.description || "",
      payload.summary || "",
      payload.fileName || "",
      payload.fileUrl || "",
      payload.filePath || "",
      payload.fileExtension || "",
      payload.mimeType || "",
      payload.fileSize || 0,
      payload.storageProvider || "local",
      coerceBoolean(payload.isFeatured, false),
      coerceBoolean(payload.isPublished, true),
      coerceBoolean(payload.allowDownloads, true),
      payload.coverImageUrl || "",
      payload.previewUrl || "",
      payload.externalUrl || "",
      payload.resourceType || payload.fileExtension || "",
      normalizeTags(payload.tags),
      parseInteger(payload.sortOrder, 0),
      isValidDate(payload.publishedAt) ? payload.publishedAt : new Date()
    ]
  );

  if (payload.categoryId) {
    await refreshCategoryCount(payload.categoryId);
  }

  return mapResourceRow(result.rows[0]);
};

export const updateResource = async (id, payload) => {
  const fields = [];
  const values = [];

  const assign = (expression, value, cast = "") => {
    fields.push(`${expression} = $${fields.length + 1}${cast ? `::${cast}` : ""}`);
    values.push(value);
  };

  if (payload.categoryId !== undefined) {
    assign("category_id", payload.categoryId || null, "integer");
  }

  if (payload.title !== undefined) {
    assign("title", payload.title);
  }

  if (payload.description !== undefined) {
    assign("description", payload.description || "");
  }

  if (payload.summary !== undefined) {
    assign("summary", payload.summary || "");
  }

  if (payload.fileName !== undefined) {
    assign("file_name", payload.fileName || "");
  }

  if (payload.fileUrl !== undefined) {
    assign("file_url", payload.fileUrl || "");
  }

  if (payload.filePath !== undefined) {
    assign("file_path", payload.filePath || "");
  }

  if (payload.fileExtension !== undefined) {
    assign("file_extension", payload.fileExtension || "");
  }

  if (payload.mimeType !== undefined) {
    assign("mime_type", payload.mimeType || "");
  }

  if (payload.fileSize !== undefined) {
    assign("file_size", payload.fileSize || 0, "integer");
  }

  if (payload.storageProvider !== undefined) {
    assign("storage_provider", payload.storageProvider || "local");
  }

  if (payload.coverImageUrl !== undefined) {
    assign("cover_image_url", payload.coverImageUrl || "");
  }

  if (payload.previewUrl !== undefined) {
    assign("preview_url", payload.previewUrl || "");
  }

  if (payload.externalUrl !== undefined) {
    assign("external_url", payload.externalUrl || "");
  }

  if (payload.resourceType !== undefined) {
    assign("resource_type", payload.resourceType || payload.fileExtension || "");
  }

  if (payload.tags !== undefined) {
    assign("tags", normalizeTags(payload.tags), "text[]");
  }

  if (payload.sortOrder !== undefined) {
    assign("sort_order", parseInteger(payload.sortOrder, 0), "integer");
  }

  if (payload.publishedAt !== undefined) {
    assign("published_at", isValidDate(payload.publishedAt) ? payload.publishedAt : null, "timestamp");
  }

  if (payload.isFeatured !== undefined) {
    assign("is_featured", coerceBoolean(payload.isFeatured), "boolean");
  }

  if (payload.isPublished !== undefined) {
    assign("is_published", coerceBoolean(payload.isPublished), "boolean");
  }

  if (payload.allowDownloads !== undefined) {
    assign("allow_downloads", coerceBoolean(payload.allowDownloads), "boolean");
  }

  if (!fields.length) {
    return getResourceById(id);
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");

  const idPlaceholder = values.length + 1;
  const result = await pool.query(
    `
      UPDATE resource_library_resources
      SET ${fields.join(", ")}
      WHERE id = $${idPlaceholder}
      RETURNING *
    `,
    [...values, id]
  );

  if (!result.rowCount) {
    return null;
  }

  const resource = mapResourceRow(result.rows[0]);

  if (resource.categoryId) {
    await refreshCategoryCount(resource.categoryId);
  }

  return resource;
};

export const deleteResource = async (id) => {
  const existing = await pool.query(
    "SELECT id, category_id, file_path FROM resource_library_resources WHERE id = $1",
    [id]
  );

  if (!existing.rowCount) {
    return null;
  }

  const record = existing.rows[0];

  await pool.query("DELETE FROM resource_library_resources WHERE id = $1", [id]);

  if (record.category_id) {
    await refreshCategoryCount(record.category_id);
  }

  return record;
};

export const recordDownload = async (resourceId, metadata = {}) => {
  await pool.query(
    `
      INSERT INTO resource_library_downloads (
        resource_id,
        download_source,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4)
    `,
    [resourceId, metadata.source || "public", metadata.ipAddress || "", metadata.userAgent || ""]
  );

  await pool.query(
    `
      UPDATE resource_library_resources
      SET download_count = download_count + 1
      WHERE id = $1
    `,
    [resourceId]
  );
};

export const getFeaturedResources = async (limit = 6) => {
  const result = await pool.query(
    `
      SELECT r.*, c.name AS category_name, c.slug AS category_slug
      FROM resource_library_resources r
      LEFT JOIN resource_library_categories c ON c.id = r.category_id
      WHERE r.is_published = true AND r.is_featured = true
      ORDER BY r.sort_order ASC, r.created_at DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map(mapResourceRow);
};

export const getOverviewStats = async () => {
  const [{ rows: totalRows }, { rows: featuredRows }, { rows: downloadRows }] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM resource_library_resources WHERE is_published = true"),
    pool.query("SELECT COUNT(*) FROM resource_library_resources WHERE is_published = true AND is_featured = true"),
    pool.query("SELECT COUNT(*) FROM resource_library_downloads")
  ]);

  const lastUpdatedResult = await pool.query(
    `
      SELECT MAX(updated_at) AS last_updated
      FROM resource_library_resources
    `
  );

  return {
    totalResources: Number(totalRows[0]?.count || 0),
    featuredResources: Number(featuredRows[0]?.count || 0),
    totalDownloads: Number(downloadRows[0]?.count || 0),
    lastUpdated: lastUpdatedResult.rows[0]?.last_updated || null
  };
};

export const getFilterOptions = async () => {
  const fileTypeResult = await pool.query(
    `
      SELECT DISTINCT
        CASE
          WHEN resource_type IS NOT NULL AND resource_type <> '' THEN LOWER(resource_type)
          ELSE LOWER(file_extension)
        END AS file_type
      FROM resource_library_resources
      WHERE resource_type <> '' OR file_extension <> ''
    `
  );

  return {
    fileTypes: fileTypeResult.rows.map((row) => row.file_type).filter(Boolean)
  };
};
