import { useEffect, useMemo, useState } from "react";
import {
  adminCreateCategory,
  adminCreateResource,
  adminDeleteCategory,
  adminDeleteResource,
  adminListResources,
  adminUpdateCategory,
  adminUpdateResource,
  adminUploadHeroImage,
  fetchLibraryCategories,
  fetchLibraryOverview
} from "../lib/resourceLibraryApi.js";
import { getSolarMkononiSettings, updateSolarMkononiSettings } from "../lib/api.js";

const defaultCategoryForm = {
  name: "",
  description: "",
  icon: "",
  accentColor: "#0f766e",
  displayOrder: 0,
  isFeatured: false,
  isActive: true
};

const defaultLibrarySettings = {
  hero: {
    eyebrow: "",
    headline: "",
    description: "",
    searchPlaceholder: "",
    primaryCta: "",
    primaryHref: "",
    backgroundImageUrl: "",
    desktopBackgroundImageUrl: "",
    mobileBackgroundImageUrl: "",
    overlayColor: "#044e38",
    overlayOpacity: 0.5
  },
  stats: {
    tagline: "",
    cards: [
      { label: "", value: "" },
      { label: "", value: "" },
      { label: "", value: "" }
    ]
  },
  quickLinks: [],
  featured: {
    title: "",
    description: ""
  },
  cta: {
    title: "",
    body: "",
    primaryText: "",
    primaryHref: "",
    secondaryText: "",
    secondaryHref: ""
  },
  focusAreas: [""],
  nav: {
    opacity: 0.85,
    slideDirection: "left"
  },
  feed: {
    columns: 2
  },
  mobileAnimation: {
    enabled: true,
    delay: 100,
    duration: 600
  }
};

const mergeLibrarySettings = (base, patch) => ({
  ...base,
  ...patch,
  hero: { ...base.hero, ...patch.hero },
  stats: { ...base.stats, ...patch.stats, cards: patch.stats?.cards || base.stats.cards },
  quickLinks: patch.quickLinks || base.quickLinks,
  featured: { ...base.featured, ...patch.featured },
  cta: { ...base.cta, ...patch.cta },
  focusAreas: patch.focusAreas || base.focusAreas,
  nav: { ...base.nav, ...patch.nav },
  feed: { ...base.feed, ...patch.feed },
  mobileAnimation: { ...base.mobileAnimation, ...patch.mobileAnimation }
});

const defaultResourceForm = {
  title: "",
  description: "",
  summary: "",
  categoryId: "",
  tags: "",
  fileName: "",
  fileUrl: "",
  externalUrl: "",
  coverImageUrl: "",
  previewUrl: "",
  resourceType: "",
  sortOrder: 0,
  publishedAt: "",
  isFeatured: false,
  allowDownloads: true,
  isPublished: true
};

const SolarResourceLibraryAdmin = ({ token, palette, setNotice, setError }) => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const [resources, setResources] = useState([]);
  const [resourceMeta, setResourceMeta] = useState({ totalPages: 1, total: 0 });
  const [resourcePage, setResourcePage] = useState(1);
  const [resourceFilters, setResourceFilters] = useState({ search: "", category: "all", sort: "featured" });
  const [resourceForm, setResourceForm] = useState(defaultResourceForm);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [resourceFile, setResourceFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [resourceSubmitting, setResourceSubmitting] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [librarySettings, setLibrarySettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState(defaultLibrarySettings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [heroImageUploading, setHeroImageUploading] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    loadCategories();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadSettings = async () => {
      try {
        const data = await fetchLibraryOverview();
        const s = data.settings || {};
        setLibrarySettings(s);
        setSettingsForm(mergeLibrarySettings(defaultLibrarySettings, s));
      } catch {
        // settings are optional
      }
    };
    loadSettings();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const debounce = setTimeout(() => {
      loadResources(resourcePage, resourceFilters);
    }, 250);

    return () => clearTimeout(debounce);
  }, [token, resourceFilters, resourcePage]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await fetchLibraryCategories({ includeInactive: true });
      setCategories(data.categories || []);
    } catch (error) {
      setError(error.message || "Unable to load categories.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadResources = async (page = resourcePage, filters = resourceFilters) => {
    setLoadingResources(true);
    try {
      const query = {
        page,
        limit: 10,
        sort: filters.sort
      };

      if (filters.search.trim()) {
        query.search = filters.search.trim();
      }

      if (filters.category !== "all") {
        query.category = filters.category;
      }

      const data = await adminListResources(token, query);
      setResources(data.resources || []);
      setResourceMeta({ totalPages: data.totalPages || 1, total: data.total || 0 });
      if (data.page && data.page !== resourcePage) {
        setResourcePage(data.page);
      }
    } catch (error) {
      setError(error.message || "Unable to load resources.");
    } finally {
      setLoadingResources(false);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setCategorySubmitting(true);
    setError("");

    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description,
        icon: categoryForm.icon,
        accentColor: categoryForm.accentColor,
        displayOrder: Number(categoryForm.displayOrder) || 0,
        isFeatured: categoryForm.isFeatured,
        isActive: categoryForm.isActive
      };

      if (!payload.name) {
        setError("Category name is required.");
        setCategorySubmitting(false);
        return;
      }

      if (editingCategoryId) {
        await adminUpdateCategory(token, editingCategoryId, payload);
        setNotice("Category updated.");
      } else {
        await adminCreateCategory(token, payload);
        setNotice("Category created.");
      }

      setCategoryForm(defaultCategoryForm);
      setEditingCategoryId(null);
      loadCategories();
    } catch (error) {
      setError(error.message || "Unable to save category.");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleCategoryEdit = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
      accentColor: category.accentColor || "#0f766e",
      displayOrder: category.displayOrder || 0,
      isFeatured: category.isFeatured,
      isActive: category.isActive
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"? Resources will remain but become uncategorized.`)) {
      return;
    }

    setError("");
    try {
      await adminDeleteCategory(token, category.id);
      setNotice("Category removed.");
      loadCategories();
    } catch (error) {
      setError(error.message || "Unable to delete category.");
    }
  };

  const handleResourceSubmit = async (event) => {
    event.preventDefault();
    setResourceSubmitting(true);
    setError("");

    try {
      const payload = {
        ...resourceForm,
        categoryId: resourceForm.categoryId ? Number(resourceForm.categoryId) : "",
        tags: resourceForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      };

      if (!payload.title) {
        setError("Resource title is required.");
        setResourceSubmitting(false);
        return;
      }

      if (editingResourceId) {
        await adminUpdateResource(token, editingResourceId, payload, resourceFile, coverImageFile);
        setNotice("Resource updated.");
      } else {
        await adminCreateResource(token, payload, resourceFile, coverImageFile);
        setNotice("Resource created.");
      }

      setResourceForm(defaultResourceForm);
      setEditingResourceId(null);
      setResourceFile(null);
      setCoverImageFile(null);
      setResourcePage(1);
      loadResources(1, resourceFilters);
    } catch (error) {
      setError(error.message || "Unable to save resource.");
    } finally {
      setResourceSubmitting(false);
    }
  };

  const handleResourceEdit = (resource) => {
    setEditingResourceId(resource.id);
    setResourceForm({
      title: resource.title,
      description: resource.description,
      summary: resource.summary,
      categoryId: resource.categoryId || "",
      tags: Array.isArray(resource.tags) ? resource.tags.join(", ") : "",
      fileName: resource.fileName,
      fileUrl: resource.fileUrl,
      externalUrl: resource.externalUrl,
      coverImageUrl: resource.coverImageUrl,
      previewUrl: resource.previewUrl,
      resourceType: resource.resourceType,
      sortOrder: resource.sortOrder || 0,
      publishedAt: resource.publishedAt ? new Date(resource.publishedAt).toISOString().slice(0, 16) : "",
      isFeatured: resource.isFeatured,
      allowDownloads: resource.allowDownloads,
      isPublished: resource.isPublished
    });
    setResourceFile(null);
    setCoverImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResourceDelete = async (resource) => {
    if (!window.confirm(`Delete resource "${resource.title}"?`)) {
      return;
    }

    setError("");
    try {
      await adminDeleteResource(token, resource.id);
      setNotice("Resource removed.");
      loadResources(resourcePage, resourceFilters);
    } catch (error) {
      setError(error.message || "Unable to delete resource.");
    }
  };

  const handleHeroImageUpload = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setHeroImageUploading(true);
    setError("");

    try {
      const { imageUrl } = await adminUploadHeroImage(token, file);
      setHero(field, imageUrl);
      setNotice("Hero background image uploaded.");
    } catch (error) {
      setError(error.message || "Unable to upload hero background image.");
    } finally {
      setHeroImageUploading(false);
      event.target.value = "";
    }
  };

  const handleSettingsSave = async () => {
    setSettingsSaving(true);
    setError("");
    try {
      const current = await getSolarMkononiSettings();
      const currentLib = current.settings?.solarResourceLibrary || {};
      await updateSolarMkononiSettings(token, { solarResourceLibrary: { ...currentLib, ...settingsForm } });
      setNotice("Library settings saved.");
    } catch (error) {
      setError(error.message || "Unable to save settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const setHero = (key, value) => setSettingsForm((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }));
  const setStat = (index, key, value) =>
    setSettingsForm((prev) => ({ ...prev, stats: { ...prev.stats, cards: prev.stats.cards.map((c, i) => (i === index ? { ...c, [key]: value } : c)) } }));
  const setStatTagline = (value) => setSettingsForm((prev) => ({ ...prev, stats: { ...prev.stats, tagline: value } }));
  const setQuickLink = (index, key, value) =>
    setSettingsForm((prev) => ({ ...prev, quickLinks: prev.quickLinks.map((l, i) => (i === index ? { ...l, [key]: value } : l)) }));
  const addQuickLink = () =>
    setSettingsForm((prev) => ({ ...prev, quickLinks: [...prev.quickLinks, { label: "", description: "", categorySlug: "", accentColor: "#0f766e" }] }));
  const removeQuickLink = (index) => setSettingsForm((prev) => ({ ...prev, quickLinks: prev.quickLinks.filter((_, i) => i !== index) }));
  const setFeatured = (key, value) => setSettingsForm((prev) => ({ ...prev, featured: { ...prev.featured, [key]: value } }));
  const setCta = (key, value) => setSettingsForm((prev) => ({ ...prev, cta: { ...prev.cta, [key]: value } }));
  const setFocusArea = (index, value) =>
    setSettingsForm((prev) => ({ ...prev, focusAreas: prev.focusAreas.map((a, i) => (i === index ? value : a)) }));
  const addFocusArea = () => setSettingsForm((prev) => ({ ...prev, focusAreas: [...prev.focusAreas, ""] }));
  const removeFocusArea = (index) => setSettingsForm((prev) => ({ ...prev, focusAreas: prev.focusAreas.filter((_, i) => i !== index) }));
  const setNav = (key, value) => setSettingsForm((prev) => ({ ...prev, nav: { ...prev.nav, [key]: value } }));
  const setFeed = (key, value) => setSettingsForm((prev) => ({ ...prev, feed: { ...prev.feed, [key]: value } }));
  const setMobileAnimation = (key, value) =>
    setSettingsForm((prev) => ({ ...prev, mobileAnimation: { ...prev.mobileAnimation, [key]: value } }));

  const categoryOptions = useMemo(() => [...categories].sort((a, b) => a.displayOrder - b.displayOrder), [categories]);

  if (!token) {
    return (
      <section className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
        <h2 className="text-2xl font-semibold" style={{ color: palette.textColor }}>Solar Resource Library</h2>
        <p className="mt-2 text-sm" style={{ color: palette.mutedTextColor }}>Please sign in to manage the resource library.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
        <div className="flex flex-col gap-3 border-b pb-4" style={{ borderColor: palette.borderColor }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Solar Resource Library</p>
            <p className="text-sm" style={{ color: palette.mutedTextColor }}>Manage categories, upload files, and control featured resources.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: palette.mutedTextColor }}>
            <span>Total categories: {categories.length}</span>
            <span>Total resources: {resourceMeta.total}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleResourceSubmit} className="space-y-4 rounded-3xl border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: palette.textColor }}>{editingResourceId ? "Edit resource" : "Create resource"}</p>
                <p className="text-xs" style={{ color: palette.mutedTextColor }}>Upload files up to 30 MB or link external URLs.</p>
              </div>
              {editingResourceId ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-rose-600"
                  onClick={() => {
                    setEditingResourceId(null);
                    setResourceForm(defaultResourceForm);
                    setResourceFile(null);
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Title
              <input
                type="text"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                value={resourceForm.title}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>

            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Summary / description
              <textarea
                rows={3}
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                value={resourceForm.summary || resourceForm.description}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, summary: event.target.value, description: event.target.value }))}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Category
                <select
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={resourceForm.categoryId}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                >
                  <option value="">Uncategorized</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Tags (comma separated)
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={resourceForm.tags}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, tags: event.target.value }))}
                  placeholder="policy, training"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                File upload
                <input
                  type="file"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  onChange={(event) => setResourceFile(event.target.files?.[0] || null)}
                />
                <p className="mt-1 text-xs" style={{ color: palette.mutedTextColor }}>PDF, DOCX, XLSX, PPTX, ZIP, MP4, MP3, CSV (max 30 MB).</p>
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                External file URL
                <input
                  type="url"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={resourceForm.fileUrl}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, fileUrl: event.target.value }))}
                  placeholder="https://..."
                />
                <p className="mt-1 text-xs" style={{ color: palette.mutedTextColor }}>Optional if uploading a file.</p>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Cover image file (optional)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  onChange={(event) => setCoverImageFile(event.target.files?.[0] || null)}
                />
                {coverImageFile ? <p className="mt-1 text-xs" style={{ color: palette.mutedTextColor }}>{coverImageFile.name}</p> : null}
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Cover image URL (optional)
                <input
                  type="url"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={resourceForm.coverImageUrl}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                External preview URL
                <input
                  type="url"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={resourceForm.externalUrl}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, externalUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Resource type label
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={resourceForm.resourceType}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, resourceType: event.target.value }))}
                  placeholder="pdf, toolkit"
                />
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Sort order
                <input
                  type="number"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={resourceForm.sortOrder}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                />
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Published at
                <input
                  type="datetime-local"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={resourceForm.publishedAt}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, publishedAt: event.target.value }))}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}>
                Featured
                <input
                  type="checkbox"
                  checked={resourceForm.isFeatured}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}>
                Published
                <input
                  type="checkbox"
                  checked={resourceForm.isPublished}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}>
                Allow downloads
                <input
                  type="checkbox"
                  checked={resourceForm.allowDownloads}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, allowDownloads: event.target.checked }))}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={resourceSubmitting}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resourceSubmitting ? "Saving..." : editingResourceId ? "Update resource" : "Create resource"}
            </button>
          </form>

          <div className="space-y-4">
            <form onSubmit={handleCategorySubmit} className="space-y-4 rounded-3xl border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: palette.textColor }}>{editingCategoryId ? "Edit category" : "Add category"}</p>
                {editingCategoryId ? (
                  <button
                    type="button"
                    className="text-sm font-semibold text-rose-600"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryForm(defaultCategoryForm);
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Name
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>

              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Description
                <textarea
                  rows={2}
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                  Accent color
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                    <input
                      type="color"
                      className="h-10 w-16 rounded"
                      value={categoryForm.accentColor}
                      onChange={(event) => setCategoryForm((prev) => ({ ...prev, accentColor: event.target.value }))}
                    />
                    <input
                      type="text"
                      className="flex-1 border-none bg-transparent text-sm outline-none"
                      value={categoryForm.accentColor}
                      onChange={(event) => setCategoryForm((prev) => ({ ...prev, accentColor: event.target.value }))}
                    />
                  </div>
                </label>
                <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                  Display order
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                    value={categoryForm.displayOrder}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, displayOrder: Number(event.target.value) }))}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}>
                  Featured
                  <input
                    type="checkbox"
                    checked={categoryForm.isFeatured}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
                  />
                </label>
                <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}>
                  Active
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={categorySubmitting}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {categorySubmitting ? "Saving..." : editingCategoryId ? "Update category" : "Add category"}
              </button>
            </form>

            <div className="rounded-3xl border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Categories</p>
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500"
                  onClick={loadCategories}
                  disabled={loadingCategories}
                >
                  {loadingCategories ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <div className="mt-4 space-y-3 max-h-[360px] overflow-auto pr-2">
                {categories.length ? (
                  categories.map((category) => (
                    <div key={category.id} className="rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.accentColor || "#0f766e" }}
                            />
                            <p className="text-sm font-semibold" style={{ color: palette.textColor }}>{category.name}</p>
                          </div>
                          <p className="text-xs" style={{ color: palette.mutedTextColor }}>{category.description || "No description"}</p>
                        </div>
                        <div className="text-right text-xs" style={{ color: palette.mutedTextColor }}>
                          <p>{category.resourceCount || 0} resources</p>
                          <p>{category.isActive ? "Active" : "Inactive"}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2 text-xs">
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-1 font-semibold"
                          style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          onClick={() => handleCategoryEdit(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-1 font-semibold"
                          style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                          onClick={() => handleCategoryDelete(category)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: palette.mutedTextColor }}>No categories yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
        <div className="border-b pb-4" style={{ borderColor: palette.borderColor }}>
          <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Library Landing Page Settings</p>
          <p className="text-sm" style={{ color: palette.mutedTextColor }}>Customize hero content, stats, quick links, featured section, CTA, focus areas, and mobile animation.</p>
        </div>

        <div className="mt-6 space-y-8">
          <section>
            <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Hero content</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Eyebrow
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.eyebrow}
                  onChange={(event) => setHero("eyebrow", event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Headline
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.headline}
                  onChange={(event) => setHero("headline", event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium md:col-span-2" style={{ color: palette.textColor }}>
                Description
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.description}
                  onChange={(event) => setHero("description", event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Search placeholder
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.searchPlaceholder}
                  onChange={(event) => setHero("searchPlaceholder", event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Hero CTA text
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.primaryCta}
                  onChange={(event) => setHero("primaryCta", event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Hero CTA link
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.primaryHref}
                  onChange={(event) => setHero("primaryHref", event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Default background image (fallback)
                <input
                  type="url"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.backgroundImageUrl}
                  onChange={(event) => setHero("backgroundImageUrl", event.target.value)}
                  placeholder="https://..."
                />
                <span className="mt-1 block text-xs" style={{ color: palette.mutedTextColor }}>Or upload from your computer</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={heroImageUploading}
                  className="mt-2 w-full text-sm file:mr-3 file:rounded-2xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onChange={(event) => handleHeroImageUpload(event, "backgroundImageUrl")}
                />
                {heroImageUploading ? (
                  <span className="mt-1 block text-xs" style={{ color: palette.mutedTextColor }}>Uploading...</span>
                ) : null}
                {settingsForm.hero.backgroundImageUrl ? (
                  <img src={settingsForm.hero.backgroundImageUrl} alt="Hero preview" className="mt-2 h-24 w-full rounded-2xl object-cover" />
                ) : null}
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Desktop background image
                <input
                  type="url"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.desktopBackgroundImageUrl}
                  onChange={(event) => setHero("desktopBackgroundImageUrl", event.target.value)}
                  placeholder="https://..."
                />
                <span className="mt-1 block text-xs" style={{ color: palette.mutedTextColor }}>Or upload from your computer</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={heroImageUploading}
                  className="mt-2 w-full text-sm file:mr-3 file:rounded-2xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onChange={(event) => handleHeroImageUpload(event, "desktopBackgroundImageUrl")}
                />
                {heroImageUploading ? (
                  <span className="mt-1 block text-xs" style={{ color: palette.mutedTextColor }}>Uploading...</span>
                ) : null}
                {settingsForm.hero.desktopBackgroundImageUrl ? (
                  <img src={settingsForm.hero.desktopBackgroundImageUrl} alt="Desktop hero preview" className="mt-2 h-24 w-full rounded-2xl object-cover" />
                ) : null}
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Mobile background image
                <input
                  type="url"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.mobileBackgroundImageUrl}
                  onChange={(event) => setHero("mobileBackgroundImageUrl", event.target.value)}
                  placeholder="https://..."
                />
                <span className="mt-1 block text-xs" style={{ color: palette.mutedTextColor }}>Or upload from your computer</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={heroImageUploading}
                  className="mt-2 w-full text-sm file:mr-3 file:rounded-2xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onChange={(event) => handleHeroImageUpload(event, "mobileBackgroundImageUrl")}
                />
                {heroImageUploading ? (
                  <span className="mt-1 block text-xs" style={{ color: palette.mutedTextColor }}>Uploading...</span>
                ) : null}
                {settingsForm.hero.mobileBackgroundImageUrl ? (
                  <img src={settingsForm.hero.mobileBackgroundImageUrl} alt="Mobile hero preview" className="mt-2 h-24 w-full rounded-2xl object-cover" />
                ) : null}
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Overlay color
                <input
                  type="color"
                  className="mt-2 h-10 w-full rounded-2xl border px-1 py-1"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.hero.overlayColor || "#044e38"}
                  onChange={(event) => setHero("overlayColor", event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                Overlay opacity ({Math.round(settingsForm.hero.overlayOpacity * 100)}%)
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  className="mt-3 w-full"
                  value={settingsForm.hero.overlayOpacity}
                  onChange={(event) => setHero("overlayOpacity", Number(event.target.value))}
                />
              </label>
            </div>
          </section>

          <section>
            <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Stats</p>
            <label className="mt-3 block text-sm font-medium" style={{ color: palette.textColor }}>
              Tagline
              <input
                type="text"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                value={settingsForm.stats.tagline}
                onChange={(event) => setStatTagline(event.target.value)}
              />
            </label>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {settingsForm.stats.cards.map((card, index) => (
                <div key={index} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: palette.borderColor }}>
                  <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                    Label
                    <input
                      type="text"
                      className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                      value={card.label}
                      onChange={(event) => setStat(index, "label", event.target.value)}
                    />
                  </label>
                  <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                    Value
                    <input
                      type="text"
                      className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                      value={card.value}
                      onChange={(event) => setStat(index, "value", event.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Quick links</p>
              <button
                type="button"
                onClick={addQuickLink}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Add quick link
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {settingsForm.quickLinks.map((link, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-5" style={{ borderColor: palette.borderColor }}>
                  <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                    Label
                    <input
                      type="text"
                      className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                      value={link.label}
                      onChange={(event) => setQuickLink(index, "label", event.target.value)}
                    />
                  </label>
                  <label className="block text-sm font-medium md:col-span-2" style={{ color: palette.textColor }}>
                    Description
                    <input
                      type="text"
                      className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                      value={link.description}
                      onChange={(event) => setQuickLink(index, "description", event.target.value)}
                    />
                  </label>
                  <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                    Category slug
                    <input
                      type="text"
                      className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                      style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                      value={link.categorySlug}
                      onChange={(event) => setQuickLink(index, "categorySlug", event.target.value)}
                    />
                  </label>
                  <div className="flex items-end gap-2">
                    <label className="block flex-1 text-sm font-medium" style={{ color: palette.textColor }}>
                      Color
                      <input
                        type="color"
                        className="mt-2 h-11 w-full rounded-2xl border px-2 py-1"
                        style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                        value={link.accentColor}
                        onChange={(event) => setQuickLink(index, "accentColor", event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeQuickLink(index)}
                      className="mb-0.5 rounded-xl border px-3 py-2.5 text-xs font-semibold text-rose-600"
                      style={{ borderColor: "#fecaca" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Featured section</p>
              <label className="mt-3 block text-sm font-medium" style={{ color: palette.textColor }}>
                Title
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.featured.title}
                  onChange={(event) => setFeatured("title", event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm font-medium" style={{ color: palette.textColor }}>
                Description
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.featured.description}
                  onChange={(event) => setFeatured("description", event.target.value)}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Need something custom?</p>
              <label className="mt-3 block text-sm font-medium" style={{ color: palette.textColor }}>
                Title
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.cta.title}
                  onChange={(event) => setCta("title", event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm font-medium" style={{ color: palette.textColor }}>
                Body
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                  value={settingsForm.cta.body}
                  onChange={(event) => setCta("body", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Primary button text
              <input
                type="text"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                value={settingsForm.cta.primaryText}
                onChange={(event) => setCta("primaryText", event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Primary button link
              <input
                type="text"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                value={settingsForm.cta.primaryHref}
                onChange={(event) => setCta("primaryHref", event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Secondary button text
              <input
                type="text"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                value={settingsForm.cta.secondaryText}
                onChange={(event) => setCta("secondaryText", event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Secondary button link
              <input
                type="text"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                value={settingsForm.cta.secondaryHref}
                onChange={(event) => setCta("secondaryHref", event.target.value)}
              />
            </label>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Library focus areas</p>
              <button
                type="button"
                onClick={addFocusArea}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Add focus area
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {settingsForm.focusAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-2xl border px-4 py-3 text-sm"
                    style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                    value={area}
                    onChange={(event) => setFocusArea(index, event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeFocusArea(index)}
                    className="rounded-xl border px-3 py-2.5 text-xs font-semibold text-rose-600"
                    style={{ borderColor: "#fecaca" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Nav transparency ({Math.round(settingsForm.nav.opacity * 100)}%)
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                className="mt-3 w-full"
                value={settingsForm.nav.opacity}
                onChange={(event) => setNav("opacity", Number(event.target.value))}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Mobile menu slide direction
              <select
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                value={settingsForm.nav.slideDirection}
                onChange={(event) => setNav("slideDirection", event.target.value)}
              >
                <option value="left">Slide from left</option>
                <option value="right">Slide from right</option>
              </select>
            </label>
            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Resources per row (big screens)
              <select
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                value={settingsForm.feed.columns}
                onChange={(event) => setFeed("columns", Number(event.target.value))}
              >
                <option value={2}>2 per row</option>
                <option value={3}>3 per row</option>
                <option value={4}>4 per row</option>
                <option value={5}>5 per row</option>
              </select>
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: palette.textColor }}>
              <input
                type="checkbox"
                checked={settingsForm.mobileAnimation.enabled}
                onChange={(event) => setMobileAnimation("enabled", event.target.checked)}
                className="h-5 w-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              Enable mobile card animation
            </label>
            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Animation delay (ms)
              <input
                type="number"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                value={settingsForm.mobileAnimation.delay}
                onChange={(event) => setMobileAnimation("delay", Number(event.target.value))}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
              Animation duration (ms)
              <input
                type="number"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
                value={settingsForm.mobileAnimation.duration}
                onChange={(event) => setMobileAnimation("duration", Number(event.target.value))}
              />
            </label>
          </section>
        </div>

        <button
          type="button"
          disabled={settingsSaving}
          onClick={handleSettingsSave}
          className="mt-8 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {settingsSaving ? "Saving..." : "Save library settings"}
        </button>
      </div>

      <div className="rounded-[28px] border p-6" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: palette.textColor }}>Resource inventory</p>
            <p className="text-sm" style={{ color: palette.mutedTextColor }}>Search, filter, and manage uploaded resources.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <input
              type="search"
              placeholder="Search titles"
              className="rounded-2xl border px-4 py-2"
              style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              value={resourceFilters.search}
              onChange={(event) => {
                setResourceFilters((prev) => ({ ...prev, search: event.target.value }));
                setResourcePage(1);
              }}
            />
            <select
              className="rounded-2xl border px-4 py-2"
              style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              value={resourceFilters.category}
              onChange={(event) => {
                setResourceFilters((prev) => ({ ...prev, category: event.target.value }));
                setResourcePage(1);
              }}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-2xl border px-4 py-2"
              style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
              value={resourceFilters.sort}
              onChange={(event) => {
                setResourceFilters((prev) => ({ ...prev, sort: event.target.value }));
                setResourcePage(1);
              }}
            >
              <option value="featured">Featured first</option>
              <option value="newest">Newest</option>
              <option value="popular">Most downloaded</option>
              <option value="alpha">A → Z</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border" style={{ borderColor: palette.borderColor }}>
          <table className="min-w-full text-left text-sm">
            <thead style={{ backgroundColor: palette.surfaceMuted }}>
              <tr>
                <th className="px-4 py-3 font-semibold" style={{ color: palette.textColor }}>Title</th>
                <th className="px-4 py-3 font-semibold" style={{ color: palette.textColor }}>Category</th>
                <th className="px-4 py-3 font-semibold" style={{ color: palette.textColor }}>Published</th>
                <th className="px-4 py-3 font-semibold" style={{ color: palette.textColor }}>Downloads</th>
                <th className="px-4 py-3 font-semibold" style={{ color: palette.textColor }}>Status</th>
                <th className="px-4 py-3 font-semibold text-right" style={{ color: palette.textColor }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingResources ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm" style={{ color: palette.mutedTextColor }}>
                    Loading resources...
                  </td>
                </tr>
              ) : resources.length ? (
                resources.map((resource) => (
                  <tr key={resource.id} className="border-t" style={{ borderColor: palette.borderColor }}>
                    <td className="px-4 py-4">
                      <div className="font-semibold" style={{ color: palette.textColor }}>{resource.title}</div>
                      <div className="text-xs" style={{ color: palette.mutedTextColor }}>{resource.summary || resource.description}</div>
                    </td>
                    <td className="px-4 py-4 text-xs" style={{ color: palette.mutedTextColor }}>{resource.category?.name || "-"}</td>
                    <td className="px-4 py-4 text-xs" style={{ color: palette.mutedTextColor }}>{resource.publishedAt ? new Date(resource.publishedAt).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-4 text-xs" style={{ color: palette.mutedTextColor }}>{resource.downloadCount || 0}</td>
                    <td className="px-4 py-4 text-xs" style={{ color: palette.mutedTextColor }}>
                      {resource.isPublished ? "Published" : "Draft"}
                      {resource.isFeatured ? " • Featured" : ""}
                    </td>
                    <td className="px-4 py-4 text-right text-xs">
                      <button
                        type="button"
                        className="rounded-xl border px-3 py-1 font-semibold"
                        style={{ borderColor: palette.borderColor, color: palette.textColor }}
                        onClick={() => handleResourceEdit(resource)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ml-2 rounded-xl border px-3 py-1 font-semibold"
                        style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                        onClick={() => handleResourceDelete(resource)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm" style={{ color: palette.mutedTextColor }}>
                    No resources match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {resourceMeta.totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              className="rounded-2xl border px-4 py-2 font-semibold"
              style={{ borderColor: palette.borderColor, color: palette.textColor }}
              disabled={resourcePage === 1}
              onClick={() => setResourcePage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <p style={{ color: palette.mutedTextColor }}>
              Page {resourcePage} of {resourceMeta.totalPages}
            </p>
            <button
              type="button"
              className="rounded-2xl border px-4 py-2 font-semibold"
              style={{ borderColor: palette.borderColor, color: palette.textColor }}
              disabled={resourcePage >= resourceMeta.totalPages}
              onClick={() => setResourcePage((prev) => Math.min(resourceMeta.totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default SolarResourceLibraryAdmin;
