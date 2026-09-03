export const API_URL = import.meta.env.VITE_API_URL || "";

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson ? data?.message : "Request failed.";
    const error = new Error(message || "Request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === "string" && value.trim() === "") {
      return;
    }

    if (Array.isArray(value)) {
      if (!value.length) {
        return;
      }

      query.set(key, value.join(","));
      return;
    }

    query.set(key, value);
  });

  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

const requestJson = async (path, { method = "GET", token, body, query } = {}) => {
  const qs = buildQueryString(query);
  const response = await fetch(`${API_URL}${path}${qs}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  return parseResponse(response);
};

export const adminUploadHeroImage = (token, file) => {
  const formData = new FormData();
  formData.append("heroImage", file);

  return requestFormData("/api/solar-library/admin/hero-image", {
    method: "POST",
    token,
    formData
  });
};

const requestFormData = async (path, { method = "POST", token, query, formData }) => {
  const qs = buildQueryString(query);
  const response = await fetch(`${API_URL}${path}${qs}`, {
    method,
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined,
    body: formData
  });

  return parseResponse(response);
};

export const fetchLibraryOverview = () => requestJson("/api/solar-library/overview");

export const fetchPublicResources = (params = {}) =>
  requestJson("/api/solar-library/resources", {
    query: params
  });

export const fetchLibraryCategories = (options = {}) =>
  requestJson("/api/solar-library/categories", {
    query: options
  });

export const adminListResources = (token, params = {}) =>
  requestJson("/api/solar-library/admin/resources", {
    token,
    query: params
  });

export const adminCreateCategory = (token, payload) =>
  requestJson("/api/solar-library/admin/categories", {
    method: "POST",
    token,
    body: payload
  });

export const adminUpdateCategory = (token, id, payload) =>
  requestJson(`/api/solar-library/admin/categories/${id}`, {
    method: "PUT",
    token,
    body: payload
  });

export const adminDeleteCategory = (token, id) =>
  requestJson(`/api/solar-library/admin/categories/${id}`, {
    method: "DELETE",
    token
  });

const buildResourceFormData = (payload = {}, file, coverImageFile) => {
  const formData = new FormData();

  const append = (key, value) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === "string" && value.trim() === "") {
      return;
    }

    formData.append(key, value);
  };

  append("categoryId", payload.categoryId ? String(payload.categoryId) : "");
  append("title", payload.title || "");
  append("description", payload.description || "");
  append("summary", payload.summary || "");
  append("coverImageUrl", payload.coverImageUrl || "");
  append("previewUrl", payload.previewUrl || "");
  append("externalUrl", payload.externalUrl || "");
  append("fileUrl", payload.fileUrl || "");
  append("fileName", payload.fileName || "");
  append("resourceType", payload.resourceType || "");
  append("tags", Array.isArray(payload.tags) ? payload.tags.join(",") : payload.tags || "");
  append("sortOrder", payload.sortOrder === 0 ? 0 : payload.sortOrder);
  append("publishedAt", payload.publishedAt || "");
  append("isFeatured", payload.isFeatured ? "true" : "false");
  append("isPublished", payload.isPublished === false ? "false" : "true");
  append("allowDownloads", payload.allowDownloads === false ? "false" : "true");

  if (file) {
    formData.append("file", file);
  }

  if (coverImageFile) {
    formData.append("coverImage", coverImageFile);
  }

  return formData;
};

export const adminCreateResource = (token, payload, file, coverImageFile) =>
  requestFormData("/api/solar-library/admin/resources", {
    method: "POST",
    token,
    formData: buildResourceFormData(payload, file, coverImageFile)
  });

export const adminUpdateResource = (token, id, payload, file, coverImageFile) =>
  requestFormData(`/api/solar-library/admin/resources/${id}`, {
    method: "PUT",
    token,
    formData: buildResourceFormData(payload, file, coverImageFile)
  });

export const adminDeleteResource = (token, id) =>
  requestJson(`/api/solar-library/admin/resources/${id}`, {
    method: "DELETE",
    token
  });
