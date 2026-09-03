import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL, fetchLibraryOverview, fetchPublicResources } from "../lib/resourceLibraryApi.js";
import { getSolarMkononiSettings } from "../lib/api.js";

const formatBytes = (bytes) => {
  if (!bytes || Number.isNaN(bytes)) {
    return "-";
  }

  const thresh = 1024;
  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let u = -1;
  let value = bytes;

  do {
    value /= thresh;
    ++u;
  } while (Math.abs(value) >= thresh && u < units.length - 1);

  return `${value.toFixed(1)} ${units[u]}`;
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const hexToRgba = (hex, alpha) => {
  const clean = (hex || "#044e38").replace("#", "");
  const valid = /^[0-9A-Fa-f]{3,6}$/.test(clean);
  if (!valid) {
    return `rgba(4, 78, 56, ${alpha ?? 1})`;
  }

  const expand = (short) =>
    short.length === 3
      ? short.split("").map((c) => c + c).join("")
      : short;

  const full = expand(clean);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha ?? 1})`;
};

const fileBadgeStyles = {
  pdf: { label: "PDF", background: "#fee2e2", color: "#b91c1c" },
  doc: { label: "DOC", background: "#e0ecff", color: "#1d4ed8" },
  docx: { label: "DOCX", background: "#e0ecff", color: "#1d4ed8" },
  xls: { label: "XLS", background: "#e0f2fe", color: "#0369a1" },
  xlsx: { label: "XLSX", background: "#e0f2fe", color: "#0369a1" },
  csv: { label: "CSV", background: "#fef9c3", color: "#854d0e" },
  ppt: { label: "PPT", background: "#ffedd5", color: "#9a3412" },
  pptx: { label: "PPTX", background: "#ffedd5", color: "#9a3412" },
  zip: { label: "ZIP", background: "#f3e8ff", color: "#6b21a8" },
  mp4: { label: "MP4", background: "#dbeafe", color: "#1d4ed8" },
  mp3: { label: "MP3", background: "#ede9fe", color: "#5b21b6" }
};

const getFileBadge = (resource, fileTypeLabels = {}) => {
  const extension = (resource.fileExtension || resource.resourceType || "").toLowerCase();
  const fallbackLabel = fileTypeLabels[extension] || extension.toUpperCase() || "FILE";

  if (fileBadgeStyles[extension]) {
    return { label: fileBadgeStyles[extension].label || fallbackLabel, ...fileBadgeStyles[extension] };
  }

  return {
    label: fallbackLabel,
    background: "#e0f2f1",
    color: "#065f46"
  };
};

const defaultFilters = {
  search: "",
  category: "all",
  fileType: "all",
  sort: "featured",
  tag: ""
};

const cardColors = [
  { bg: "#f0fdf4", border: "#bbf7d0" },
  { bg: "#eff6ff", border: "#bfdbfe" },
  { bg: "#fefce8", border: "#fde68a" },
  { bg: "#fdf2f8", border: "#fbcfe8" },
  { bg: "#f5f3ff", border: "#ddd6fe" },
  { bg: "#fff7ed", border: "#fed7aa" },
  { bg: "#ecfeff", border: "#a5f3fc" },
  { bg: "#f0fdfa", border: "#99f6e4" }
];

const getCardColor = (index) => cardColors[index % cardColors.length];

const SolarResourceLibraryPage = () => {
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [searchInput, setSearchInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [resourceState, setResourceState] = useState({ resources: [], page: 1, totalPages: 1, total: 0 });
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState("");
  const [page, setPage] = useState(1);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [solarSettings, setSolarSettings] = useState(null);
  const feedRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadOverview = async () => {
      setLoadingOverview(true);
      setOverviewError("");

      try {
        const data = await fetchLibraryOverview();
        setOverview(data);
        setSearchInput(filters.search);
        setTagInput(filters.tag);

        if (data?.settings?.seo?.title) {
          document.title = data.settings.seo.title;
        }
      } catch (error) {
        setOverviewError(error.message || "Unable to load resource library overview.");
      } finally {
        setLoadingOverview(false);
      }
    };

    loadOverview();
  }, []);

  useEffect(() => {
    const loadSolarSettings = async () => {
      try {
        const data = await getSolarMkononiSettings();
        setSolarSettings(data.settings);
      } catch {
        // footer is optional
      }
    };
    loadSolarSettings();
  }, []);

  useEffect(() => {
    const loadResources = async () => {
      setResourcesLoading(true);
      setResourcesError("");

      try {
        const query = {
          page,
          limit: 9,
          sort: filters.sort
        };

        if (filters.search.trim()) {
          query.search = filters.search.trim();
        }

        if (filters.category !== "all") {
          query.category = filters.category;
        }

        if (filters.fileType !== "all") {
          query.fileTypes = [filters.fileType];
        }

        if (filters.tag.trim()) {
          query.tags = [filters.tag.trim()];
        }

        const data = await fetchPublicResources(query);
        setResourceState({
          resources: data.resources || [],
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0
        });
      } catch (error) {
        setResourcesError(error.message || "Unable to load resources.");
      } finally {
        setResourcesLoading(false);
      }
    };

    loadResources();
  }, [filters, page]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    setTagInput(filters.tag);
  }, [filters.tag]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== filters.search) {
        setFilters((prev) => ({ ...prev, search: trimmed }));
        setPage(1);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleSearchSubmit = (event) => {
    event?.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed !== filters.search) {
      setFilters((prev) => ({ ...prev, search: trimmed }));
      setPage(1);
      scrollToFeed();
    }
  };

  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, tag: tagInput.trim() }));
    setPage(1);
    scrollToFeed();
  };

  const scrollToFeed = () => {
    if (feedRef.current) {
      feedRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const categories = overview?.categories || [];
  const featuredResources = overview?.featuredResources || [];
  const librarySettings = overview?.settings || {};
  const sortOptions = librarySettings.filters?.sortOptions || [
    { value: "featured", label: "Featured" },
    { value: "newest", label: "Newest" },
    { value: "popular", label: "Most downloaded" },
    { value: "alpha", label: "A → Z" }
  ];
  const fileTypes = overview?.filters?.fileTypes || [];

  const activeCategory = useMemo(() => {
    if (filters.category === "all") {
      return null;
    }

    return categories.find((item) => item.slug === filters.category) || null;
  }, [categories, filters.category]);

  const handleCategoryChange = (value) => {
    setFilters((prev) => ({ ...prev, category: value }));
    setPage(1);
    scrollToFeed();
  };

  const handleFileTypeChange = (value) => {
    setFilters((prev) => ({ ...prev, fileType: value }));
    setPage(1);
  };

  const handleSortChange = (value) => {
    setFilters((prev) => ({ ...prev, sort: value }));
    setPage(1);
  };

  const quickLinks = librarySettings.quickLinks || [];
  const statsCards = librarySettings.stats?.cards || [];
  const hero = librarySettings.hero || {};
  const cta = librarySettings.cta || {};
  const emptyState = librarySettings.emptyState || {};
  const feedColumns = librarySettings.feed?.columns || 2;
  const columnClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-2 lg:grid-cols-5"
  };
  const feedGridClass = columnClasses[feedColumns] || columnClasses[2];

  const heroOverlayColor = hero.overlayColor || "#044e38";
  const heroOverlayOpacity = hero.overlayOpacity !== undefined ? hero.overlayOpacity : 0.5;
  const desktopBg = hero.desktopBackgroundImageUrl || hero.backgroundImageUrl || "";
  const mobileBg = hero.mobileBackgroundImageUrl || hero.backgroundImageUrl || "";
  const hasHeroImage = Boolean(hero.backgroundImageUrl || hero.desktopBackgroundImageUrl || hero.mobileBackgroundImageUrl);

  const heroBackgroundCss = `
    .resource-hero-bg {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    ${mobileBg ? `@media (max-width: 768px) { .resource-hero-bg { background-image: url(${mobileBg}); } }` : ""}
    ${desktopBg ? `@media (min-width: 769px) { .resource-hero-bg { background-image: url(${desktopBg}); } }` : ""}
  `;

  const mobileAnimation = librarySettings.mobileAnimation || { enabled: false };

  return (
    <div className="min-h-screen bg-[#f6fbf8]">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ${heroBackgroundCss}
      `}</style>
      <header className="resource-hero-bg relative flex min-h-screen flex-col justify-center overflow-hidden text-white">
        {hasHeroImage ? <div className="absolute inset-0" style={{ backgroundColor: hexToRgba(heroOverlayColor, heroOverlayOpacity) }} /> : null}
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">{hero.eyebrow || "Solar Mkononi"}</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{hero.headline || "Solar Mkononi Resource Library"}</h1>
            <p className="mt-4 max-w-3xl text-lg text-emerald-100">{hero.description || "Access policy briefs, financial toolkits, technical guides, and curated learnings for Kenya's clean energy ecosystem."}</p>
            <form onSubmit={handleSearchSubmit} className="mt-8 flex flex-col gap-3 rounded-3xl bg-white/10 p-2 backdrop-blur-md sm:flex-row">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={hero.searchPlaceholder || "Search policies, toolkits, best practices..."}
                className="flex-1 rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-base text-white placeholder:text-emerald-100 focus:border-white focus:outline-none"
              />
              <button type="submit" className="rounded-2xl bg-white px-6 py-3 text-base font-semibold text-emerald-800 shadow-lg shadow-emerald-900/20">
                Search library
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-emerald-100">
              <Link to="/solar-mkononi" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white">
                <span>← Back to Solar Mkononi</span>
              </Link>
              <button
                type="button"
                onClick={scrollToFeed}
                className="inline-flex items-center gap-2 text-emerald-100 hover:text-white"
              >
                Skip to resources ↓
              </button>
            </div>
          </div>
          <div className="grid flex-1 gap-4 rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-100">{librarySettings.stats?.tagline || "Library snapshot"}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {statsCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                  <div className="text-3xl font-semibold text-white">{card.value}</div>
                  <div className="mt-1 text-sm text-emerald-100">{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {overviewError ? (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{overviewError}</div>
        ) : null}

        {loadingOverview ? (
          <div className="grid gap-6 rounded-3xl border border-emerald-50 bg-white p-8 shadow-soft">
            <div className="h-6 w-1/4 animate-pulse rounded-full bg-emerald-100" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-36 animate-pulse rounded-2xl bg-emerald-50" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {quickLinks.length ? (
              <section className="mb-12 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Quick links</p>
                    <h2 className="text-2xl font-bold text-emerald-900">Jump into curated collections</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => handleCategoryChange("all")}
                      className={`rounded-full border px-4 py-2 font-medium ${filters.category === "all" ? "border-emerald-500 bg-emerald-500/10 text-emerald-700" : "border-emerald-200 text-emerald-600"}`}
                    >
                      View all categories
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {quickLinks.map((link) => (
                    <button
                      type="button"
                      key={link.categorySlug}
                      onClick={() => {
                        handleCategoryChange(link.categorySlug);
                        scrollToFeed();
                      }}
                      className="flex flex-col gap-3 rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
                      style={{ borderColor: `${link.accentColor || "#0f766e"}33` }}
                    >
                      <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: link.accentColor || "#0f766e" }}>
                        {link.label}
                      </div>
                      <p className="text-base text-slate-600">{link.description}</p>
                      <span className="text-sm font-semibold text-slate-500">Browse resources →</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {featuredResources.length ? (
              <section className="mb-12 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-sm">
                <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Featured</p>
                    <h2 className="text-2xl font-bold text-emerald-900">{librarySettings.featured?.title || "Featured resources"}</h2>
                    <p className="text-sm text-slate-600">{librarySettings.featured?.description || "Handpicked insights from the Solar Mkononi team."}</p>
                  </div>
                  <button
                    type="button"
                    onClick={scrollToFeed}
                    className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700"
                  >
                    Jump to library ↓
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredResources.map((resource, index) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      fileTypeLabels={librarySettings.filters?.fileTypeLabels}
                      cardIndex={index}
                      mobileAnimation={mobileAnimation}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        <section ref={feedRef} id="library-feed" className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Resource feed</p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {activeCategory ? activeCategory.name : "All resources"}
                </h2>
                <p className="text-sm text-slate-500">
                  {resourceState.total} resource{resourceState.total === 1 ? "" : "s"} available
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form onSubmit={handleSearchSubmit} className="flex w-full flex-1 gap-2">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search library"
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                />
                <button type="submit" className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  Go
                </button>
              </form>
              <button
                type="button"
                onClick={() => setShowMoreFilters((prev) => !prev)}
                className="rounded-2xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                {showMoreFilters ? "Hide filters" : "More filters"}
              </button>
            </div>

            {showMoreFilters ? (
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/40 p-4">
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Category</span>
                  <select
                    className="mt-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    value={filters.category}
                    onChange={(event) => handleCategoryChange(event.target.value)}
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                {fileTypes.length ? (
                  <label className="block text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">File type</span>
                    <select
                      className="mt-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                      value={filters.fileType}
                      onChange={(event) => handleFileTypeChange(event.target.value)}
                    >
                      <option value="all">All file types</option>
                      {fileTypes.map((type) => (
                        <option key={type} value={type}>
                          {(librarySettings.filters?.fileTypeLabels?.[type] || type || "").toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Sort by</span>
                  <select
                    className="mt-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    value={filters.sort}
                    onChange={(event) => handleSortChange(event.target.value)}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Tag contains</span>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    placeholder="e.g. paygo"
                    className="mt-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Apply
                </button>
              </div>
            ) : null}

              {resourcesError ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{resourcesError}</div>
              ) : null}

              {resourcesLoading ? (
                <div className={`mt-8 grid gap-4 ${feedGridClass}`}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-48 animate-pulse rounded-3xl bg-slate-100" />
                  ))}
                </div>
              ) : resourceState.resources.length ? (
                <div className={`mt-6 grid gap-4 ${feedGridClass}`}>
                  {resourceState.resources.map((resource, index) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      fileTypeLabels={librarySettings.filters?.fileTypeLabels}
                      cardIndex={index}
                      mobileAnimation={mobileAnimation}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50/70 p-8 text-center">
                  <h3 className="text-xl font-semibold text-slate-800">{emptyState.title || "Resources are being curated"}</h3>
                  <p className="mt-3 text-sm text-slate-500">{emptyState.description || "Check back soon or reach out if you need a curated pack."}</p>
                  {emptyState.actionHref ? (
                    <a
                      href={emptyState.actionHref}
                      className="mt-4 inline-flex rounded-2xl border border-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-700"
                    >
                      {emptyState.actionLabel || "Contact team"}
                    </a>
                  ) : null}
                </div>
              )}

              {resourceState.totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="text-slate-500">
                    Page {resourceState.page} of {resourceState.totalPages}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(resourceState.totalPages, prev + 1))}
                    disabled={page === resourceState.totalPages}
                    className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              ) : null}
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 p-8 text-white">
          <div className="relative z-10 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">Need something custom?</p>
              <h2 className="mt-4 text-3xl font-bold">
                {cta.title || "Can't find what you need?"}
              </h2>
              <p className="mt-3 text-emerald-100">{cta.body || "Our technical working groups can help assemble bespoke toolkits for counties, financiers, and utilities."}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {cta.primaryHref ? (
                  <a
                    href={cta.primaryHref}
                    className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-emerald-800 shadow"
                  >
                    {cta.primaryText || "Request support"}
                  </a>
                ) : null}
                {cta.secondaryHref ? (
                  <a
                    href={cta.secondaryHref}
                    className="rounded-2xl border border-white/50 px-6 py-3 text-sm font-semibold text-white"
                  >
                    {cta.secondaryText || "Visit Solar Mkononi"}
                  </a>
                ) : null}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white">
              <h3 className="text-xl font-semibold">Library focus areas</h3>
              <ul className="mt-4 space-y-3 text-sm text-emerald-100">
                {(librarySettings.focusAreas || []).map((area, index) => (
                  <li key={index}>• {area}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {solarSettings ? (
          <SolarMkononiFooter settings={solarSettings} />
        ) : null}
      </main>
    </div>
  );
};

const FileBadge = ({ resource, fileTypeLabels }) => {
  const badge = getFileBadge(resource, fileTypeLabels);
  return (
    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: badge.background, color: badge.color }}>
      {badge.label}
    </span>
  );
};

const toAbsoluteUrl = (url) => {
  if (!url || url === "#") {
    return "#";
  }
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) {
    return url;
  }
  return `${API_URL}${url}`;
};

const ResourceCard = ({ resource, fileTypeLabels, cardIndex = 0, mobileAnimation }) => {
  const badge = getFileBadge(resource, fileTypeLabels);
  const colors = getCardColor(cardIndex);
  const downloadUrl = resource.downloadUrl && resource.downloadUrl !== "#" ? resource.downloadUrl : "#";
  const viewUrl = downloadUrl !== "#" ? `${downloadUrl}?view=1` : "#";
  const canDownload = resource.allowDownloads !== false && downloadUrl !== "#";
  const canView = viewUrl !== "#";
  const shouldAnimate = mobileAnimation?.enabled;
  const delay = (mobileAnimation?.delay || 100) * cardIndex;
  const cardStyle = {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    ...(shouldAnimate ? { animation: `fadeInUp ${mobileAnimation?.duration || 600}ms ease forwards`, animationDelay: `${delay}ms` } : {})
  };

  const absoluteDownloadUrl = toAbsoluteUrl(downloadUrl);
  const absoluteViewUrl = toAbsoluteUrl(viewUrl);

  return (
    <article className="flex h-auto min-h-[18rem] flex-col overflow-hidden rounded-3xl border shadow-sm transition hover:shadow-md sm:h-72" style={cardStyle}>
      <div className="relative h-28 w-full shrink-0 sm:h-32">
        {resource.coverImageUrl ? (
          <img src={toAbsoluteUrl(resource.coverImageUrl)} alt={resource.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: colors.bg }}>
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: badge.background, color: badge.color }}>
              {badge.label}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden bg-white/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            {resource.category?.name || "Uncategorized"}
          </span>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: badge.background, color: badge.color }}>
            {badge.label}
          </span>
        </div>
        <h3 className="mt-2 text-sm font-semibold leading-tight text-slate-900 truncate" title={resource.title}>{resource.title}</h3>
        <p className="mt-1 text-xs text-slate-600 line-clamp-2">{resource.summary || resource.description}</p>
        <div className="mt-auto flex gap-2 pt-3">
          {canView ? (
            <a
              href={absoluteViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white/60 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-white"
            >
              View
            </a>
          ) : null}
          {canDownload ? (
            <a
              href={absoluteDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-2 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Download
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const SolarMkononiFooter = ({ settings }) => {
  const footer = settings.footer || {};
  const branding = settings.branding || {};
  const theme = settings.theme || {};
  const backgroundColor = footer.backgroundColor || "#064e3b";

  return (
    <footer className="mt-12 py-12 px-4" style={{ backgroundColor, borderTop: `1px solid ${theme.borderColor || "#a7f3d0"}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.logoAlt || "Solar Mkononi"} className="h-12 mb-4" />
            ) : null}
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.textColor || "#064e3b" }}>
              {footer.title || "Solar Mkononi"}
            </h3>
            <p className="text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>
              {footer.body || "Empowering Kenya with accessible renewable energy solutions"}
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4" style={{ color: theme.textColor || "#064e3b" }}>Quick Links</h4>
            <ul className="space-y-2">
              {(footer.links || []).map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:underline text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4" style={{ color: theme.textColor || "#064e3b" }}>Connect</h4>
            <div className="flex gap-4">
              {(footer.socialLinks || []).map((social, index) => (
                <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" className="text-2xl">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center pt-8" style={{ borderTop: `1px solid ${theme.borderColor || "#a7f3d0"}` }}>
          <p className="text-sm" style={{ color: theme.mutedTextColor || "#475569" }}>
            {footer.copyright || "© 2026 Solar Mkononi. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SolarResourceLibraryPage;
