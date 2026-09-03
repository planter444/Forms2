import { Router } from "express";
import multer from "multer";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import {
  ensureDefaultCategories,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listResources,
  createResource,
  updateResource,
  deleteResource,
  getResourceById,
  recordDownload,
  getFeaturedResources,
  getOverviewStats,
  getFilterOptions
} from "./resourceLibraryModel.js";
import { getSolarMkononiSettings } from "./solarMkononiSettingsStore.js";
import { requireAdmin } from "./auth.js";
import {
  saveResourceFile,
  deleteResourceFile,
  resolveResourceFilePath,
  saveCoverImage,
  deleteCoverImage,
  resolveCoverImagePath,
  ensureResourceLibraryRoot
} from "./resourceLibraryStorage.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024
  }
});

const ALLOWED_MIME_TYPES = new Map([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.ms-excel", "xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["text/csv", "csv"],
  ["application/vnd.ms-powerpoint", "ppt"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
  ["application/zip", "zip"],
  ["application/x-zip-compressed", "zip"],
  ["application/json", "json"],
  ["application/xml", "xml"],
  ["text/plain", "txt"],
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["video/mp4", "mp4"],
  ["audio/mpeg", "mp3"]
]);

const lookupMimeType = (extension) => {
  const ext = `${extension || ""}`.toLowerCase().replace(/^\./, "");
  for (const [mime, mappedExt] of ALLOWED_MIME_TYPES) {
    if (mappedExt === ext) {
      return mime;
    }
  }
  return undefined;
};

const getResourceExtension = (resource) => {
  if (resource.fileExtension) {
    return resource.fileExtension;
  }
  const name = resource.fileName || "";
  const ext = path.extname(name).toLowerCase().replace(/^\./, "");
  return ext;
};

const toBoolean = (value) => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = `${value}`.toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
};

const parseList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return `${value}`
    .split(/,|\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildDownloadUrl = (resource) => {
  if (!resource) {
    return "";
  }

  const hasFile = resource.filePath || resource.fileUrl || resource.previewUrl || resource.externalUrl;
  if (hasFile) {
    return `/api/solar-library/resources/${resource.id}/download`;
  }

  return "";
};

const serializeResource = (resource) => ({
  ...resource,
  downloadUrl: buildDownloadUrl(resource)
});

const ensureBaseState = async () => {
  await ensureResourceLibraryRoot();
  await ensureDefaultCategories();
};

router.get("/overview", async (_request, response) => {
  await ensureBaseState();
  const settings = await getSolarMkononiSettings();
  const librarySettings = settings.solarResourceLibrary || {};
  const [categories, featuredResources, stats, filterOptions] = await Promise.all([
    listCategories(),
    getFeaturedResources(6),
    getOverviewStats(),
    getFilterOptions()
  ]);

  response.json({
    settings: librarySettings,
    categories,
    featuredResources: featuredResources.map(serializeResource),
    stats,
    filters: filterOptions
  });
});

router.get("/categories", async (request, response) => {
  await ensureBaseState();
  const includeInactive = toBoolean(request.query.includeInactive);
  const categories = await listCategories({ includeInactive });
  response.json({ categories });
});

router.get("/resources", async (request, response) => {
  await ensureBaseState();
  const query = {
    page: request.query.page,
    limit: request.query.limit,
    search: request.query.search,
    category: request.query.category,
    tags: parseList(request.query.tags),
    fileTypes: parseList(request.query.fileTypes),
    sort: request.query.sort,
    featuredOnly: toBoolean(request.query.featured)
  };
  const result = await listResources(query);
  response.json({
    ...result,
    resources: result.resources.map(serializeResource)
  });
});

const proxyRemoteFile = (url, resource, request, response, isView) => {
  const protocol = url.startsWith("https:") ? https : http;
  const requestHeaders = {
    "User-Agent": request.get("user-agent") || "kerea-portal",
    "Accept-Encoding": "identity"
  };

  protocol
    .get(url, { headers: requestHeaders }, (remote) => {
      if (remote.statusCode >= 300 && remote.statusCode < 400 && remote.headers.location) {
        return proxyRemoteFile(remote.headers.location, resource, request, response, isView);
      }

      if (remote.statusCode >= 400) {
        console.error(`Remote resource returned ${remote.statusCode}: ${url}`);
        return response.status(404).json({ message: "Resource file unavailable." });
      }

      const safeName = (resource.fileName || resource.title || "resource").replace(/[\r\n"]/g, "");
      const ext = getResourceExtension(resource);
      const fileName = safeName.includes(".") ? safeName : `${safeName}.${ext || "bin"}`;

      const contentType = resource.mimeType || lookupMimeType(ext) || remote.headers["content-type"] || "application/octet-stream";
      const dispositionType = isView ? "inline" : "attachment";

      response.setHeader("Content-Type", contentType);
      response.setHeader(
        "Content-Disposition",
        `${dispositionType}; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
      );

      if (remote.headers["content-length"]) {
        response.setHeader("Content-Length", remote.headers["content-length"]);
      }

      remote.pipe(response);
      recordDownload(resource.id, {
        source: isView ? "public-view" : "public",
        ipAddress: request.ip,
        userAgent: request.get("user-agent")
      }).catch((error) => console.error("Unable to record download", error));
    })
    .on("error", (error) => {
      console.error("Remote resource proxy error", error);
      response.status(500).json({ message: "Unable to serve resource file." });
    });
};

router.get("/resources/:id/download", async (request, response) => {
  await ensureBaseState();
  const resource = await getResourceById(request.params.id);

  if (!resource || !resource.isPublished) {
    return response.status(404).json({ message: "Resource not found." });
  }

  if (!resource.allowDownloads) {
    return response.status(403).json({ message: "Downloads have been disabled for this resource." });
  }

  if (resource.filePath) {
    const fullPath = resolveResourceFilePath(resource.filePath);

    try {
      const fileInfo = await stat(fullPath);
      const ext = getResourceExtension(resource);
      const safeName = (resource.fileName || resource.title || "resource").replace(/[\r\n"]/g, "");
      const fileName = safeName.includes(".") ? safeName : `${safeName}.${ext || "bin"}`;

      response.setHeader("Content-Type", resource.mimeType || lookupMimeType(ext) || "application/octet-stream");
      response.setHeader(
        "Content-Disposition",
        `${request.query.view === "1" ? "inline" : "attachment"}; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
      );
      response.setHeader("Content-Length", fileInfo.size);
      const stream = createReadStream(fullPath);
      stream.pipe(response);
      await recordDownload(resource.id, {
        source: request.query.view === "1" ? "public-view" : "public",
        ipAddress: request.ip,
        userAgent: request.get("user-agent")
      });
      return;
    } catch (error) {
      console.error("Resource download error", error);
      const fallbackUrl = resource.fileUrl || resource.previewUrl || resource.externalUrl;
      if (error.code === "ENOENT" && fallbackUrl) {
        console.warn(`Falling back to remote file because local file is missing: ${fullPath}`);
        return proxyRemoteFile(fallbackUrl, resource, request, response, request.query.view === "1");
      }
      if (error.code === "ENOENT") {
        console.error(`Resource file not found on disk: ${fullPath} (filePath: ${resource.filePath})`);
        return response.status(404).json({ message: "Resource file not found." });
      }
      return response.status(500).json({ message: "Unable to download resource file." });
    }
  }

  const remoteUrl = resource.fileUrl || resource.previewUrl || resource.externalUrl;

  if (!remoteUrl) {
    return response.status(404).json({ message: "Resource file is unavailable." });
  }

  return proxyRemoteFile(remoteUrl, resource, request, response, request.query.view === "1");
});

const getCoverImageContentType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    case ".svg": return "image/svg+xml";
    default: return "application/octet-stream";
  }
};

router.get("/covers/:filename", async (request, response) => {
  const fileName = request.params.filename;
  const fullPath = resolveCoverImagePath(fileName);

  if (!fullPath) {
    return response.status(400).json({ message: "Invalid cover filename." });
  }

  try {
    const fileInfo = await stat(fullPath);
    response.setHeader("Content-Type", getCoverImageContentType(fileName));
    response.setHeader("Content-Length", fileInfo.size);
    const stream = createReadStream(fullPath);
    stream.pipe(response);
    return;
  } catch (error) {
    console.error("Cover image serve error", error);
    return response.status(404).json({ message: "Cover image not found." });
  }
});

router.use("/admin", requireAdmin);

router.get("/admin/resources", async (request, response) => {
  const result = await listResources({
    page: request.query.page,
    limit: request.query.limit,
    search: request.query.search,
    category: request.query.category,
    tags: parseList(request.query.tags),
    fileTypes: parseList(request.query.fileTypes),
    sort: request.query.sort,
    includeDrafts: true
  });

  response.json({
    ...result,
    resources: result.resources.map(serializeResource)
  });
});

router.post("/admin/categories", async (request, response) => {
  const payload = request.body || {};

  if (!payload.name) {
    return response.status(400).json({ message: "Category name is required." });
  }

  const category = await createCategory(payload);
  response.status(201).json({ category });
});

router.put("/admin/categories/:id", async (request, response) => {
  const category = await updateCategory(Number(request.params.id), request.body || {});

  if (!category) {
    return response.status(404).json({ message: "Category not found." });
  }

  response.json({ category });
});

router.delete("/admin/categories/:id", async (request, response) => {
  const deleted = await deleteCategory(Number(request.params.id));

  if (!deleted) {
    return response.status(404).json({ message: "Category not found." });
  }

  response.json({ success: true });
});

const parseResourcePayload = (request, file) => {
  const payload = {
    categoryId: request.body.categoryId ? Number(request.body.categoryId) : null,
    title: request.body.title,
    description: request.body.description || "",
    summary: request.body.summary || "",
    coverImageUrl: request.body.coverImageUrl || "",
    previewUrl: request.body.previewUrl || "",
    externalUrl: request.body.externalUrl || "",
    resourceType: request.body.resourceType || "",
    tags: parseList(request.body.tags),
    sortOrder: request.body.sortOrder,
    isFeatured: toBoolean(request.body.isFeatured),
    isPublished: toBoolean(request.body.isPublished ?? true),
    allowDownloads: toBoolean(request.body.allowDownloads ?? true)
  };

  if (request.body.publishedAt) {
    payload.publishedAt = new Date(request.body.publishedAt);
  }

  if (file) {
    payload.fileName = request.body.fileName || file.originalname;
    payload.mimeType = file.mimetype;
    payload.fileSize = file.size;
  } else if (request.body.fileName) {
    payload.fileName = request.body.fileName;
  }

  if (request.body.fileUrl) {
    payload.fileUrl = request.body.fileUrl;
  }

  return payload;
};

const validateFile = (file) => {
  if (!file) {
    return;
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const allowed = Array.from(ALLOWED_MIME_TYPES.keys()).join(", ");
    const error = new Error(
      `Unsupported file type. Allowed MIME types include: ${allowed}`
    );
    error.statusCode = 400;
    throw error;
  }
};

const ALLOWED_COVER_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);

const validateCoverImage = (file) => {
  if (!file) {
    return;
  }

  if (!ALLOWED_COVER_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Unsupported cover image type. Use PNG, JPG, WEBP, GIF, or SVG.");
    error.statusCode = 400;
    throw error;
  }
};

router.post("/admin/resources", upload.fields([{ name: "file", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), async (request, response) => {
  const file = request.files?.file?.[0];
  const coverImage = request.files?.coverImage?.[0];

  if (!request.body.title) {
    return response.status(400).json({ message: "Resource title is required." });
  }

  try {
    validateFile(file);
    validateCoverImage(coverImage);
  } catch (error) {
    return response.status(error.statusCode || 400).json({ message: error.message });
  }

  let fileMetadata = {};
  let coverImageUrl = request.body.coverImageUrl || "";

  if (file) {
    try {
      const saved = await saveResourceFile({
        buffer: file.buffer,
        originalName: request.body.fileName || file.originalname,
        mimeType: file.mimetype
      });
      fileMetadata = {
        fileName: saved.fileName,
        filePath: saved.relativePath || "",
        fileUrl: saved.fileUrl || "",
        fileExtension: saved.fileExtension,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        storageProvider: saved.storageProvider || "cloudinary"
      };
    } catch (error) {
      console.error("Unable to store resource file", error);
      return response.status(500).json({ message: "Unable to store uploaded file." });
    }
  }

  if (coverImage) {
    try {
      const saved = await saveCoverImage({
        buffer: coverImage.buffer,
        originalName: request.body.coverImageFileName || coverImage.originalname,
        mimeType: coverImage.mimetype
      });
      coverImageUrl = saved.coverImageUrl || coverImageUrl;
    } catch (error) {
      console.error("Unable to store cover image", error);
      return response.status(500).json({ message: "Unable to store cover image." });
    }
  }

  try {
    const resource = await createResource({
      ...parseResourcePayload(request, file),
      ...fileMetadata,
      coverImageUrl
    });

    response.status(201).json({ resource: serializeResource(resource) });
  } catch (error) {
    console.error("Create resource failed", error);
    return response.status(500).json({ message: error.message || "Unable to create resource." });
  }
});

router.put("/admin/resources/:id", upload.fields([{ name: "file", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), async (request, response) => {
  const resource = await getResourceById(request.params.id);

  if (!resource) {
    return response.status(404).json({ message: "Resource not found." });
  }

  const file = request.files?.file?.[0];
  const coverImage = request.files?.coverImage?.[0];

  try {
    validateFile(file);
    validateCoverImage(coverImage);
  } catch (error) {
    return response.status(error.statusCode || 400).json({ message: error.message });
  }

  let fileMetadata = {};
  let coverImageUrl = request.body.coverImageUrl || "";

  if (file) {
    try {
      const saved = await saveResourceFile({
        buffer: file.buffer,
        originalName: request.body.fileName || file.originalname,
        mimeType: file.mimetype
      });
      fileMetadata = {
        fileName: saved.fileName,
        filePath: saved.relativePath || "",
        fileUrl: saved.fileUrl || "",
        fileExtension: saved.fileExtension,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        storageProvider: saved.storageProvider || "cloudinary"
      };

      if (resource.filePath) {
        await deleteResourceFile(resource.filePath);
      }
    } catch (error) {
      console.error("Unable to update resource file", error);
      return response.status(500).json({ message: "Unable to store uploaded file." });
    }
  }

  if (coverImage) {
    try {
      const saved = await saveCoverImage({
        buffer: coverImage.buffer,
        originalName: request.body.coverImageFileName || coverImage.originalname,
        mimeType: coverImage.mimetype
      });
      coverImageUrl = saved.coverImageUrl || coverImageUrl;

      if (resource.coverImageUrl) {
        await deleteCoverImage(resource.coverImageUrl.split("/").pop());
      }
    } catch (error) {
      console.error("Unable to update cover image", error);
      return response.status(500).json({ message: "Unable to store cover image." });
    }
  } else if (!coverImageUrl && resource.coverImageUrl) {
    await deleteCoverImage(resource.coverImageUrl.split("/").pop());
  }

  try {
    const updated = await updateResource(Number(request.params.id), {
      ...parseResourcePayload(request, file),
      ...fileMetadata,
      coverImageUrl
    });

    response.json({ resource: serializeResource(updated) });
  } catch (error) {
    console.error("Update resource failed", error);
    return response.status(500).json({ message: error.message || "Unable to update resource." });
  }
});

router.post("/admin/hero-image", requireAdmin, upload.single("heroImage"), async (request, response) => {
  const file = request.file;

  if (!file) {
    return response.status(400).json({ message: "No image file was provided." });
  }

  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    return response.status(400).json({ message: "Only image files are allowed for the hero background." });
  }

  try {
    const saved = await saveCoverImage({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype
    });

    return response.json({ imageUrl: saved.coverImageUrl });
  } catch (error) {
    console.error("Unable to store hero image", error);
    return response.status(500).json({ message: "Unable to store hero background image." });
  }
});

router.delete("/admin/resources/:id", async (request, response) => {
  const deleted = await deleteResource(request.params.id);

  if (!deleted) {
    return response.status(404).json({ message: "Resource not found." });
  }

  if (deleted.file_path) {
    await deleteResourceFile(deleted.file_path);
  }

  response.json({ success: true });
});

router.use((error, request, response, _next) => {
  console.error("Resource library router error", error);

  if (error?.name === "MulterError") {
    return response.status(400).json({ message: `Upload error: ${error.message}` });
  }

  return response.status(error?.statusCode || 500).json({
    message: error?.message || "An unexpected error occurred."
  });
});

export default router;
