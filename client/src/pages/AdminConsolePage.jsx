import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  adminLogin,
  deleteSubmission,
  getSubmissions,
  resetSiteSettings,
  updateSiteSettings,
  uploadAdminMedia,
  getSolarMkononiSettings,
  updateSolarMkononiSettings,
  resetSolarMkononiSettings
} from "../lib/api.js";
import { clearAdminAccess, getAdminAccess, grantAdminAccess } from "../lib/adminAccess.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import {
  appearancePresetOptions,
  backgroundOptions,
  defaultSiteSettings,
  paletteOptions,
  patternOptions
} from "../lib/siteTheme.js";
import {
  buildLocationHierarchyStats,
  defaultLocationHierarchy,
  defaultLocationHierarchyText,
  getCountyPreviewRows,
  parseLocationHierarchyText,
  serializeLocationHierarchy
} from "../lib/locationHierarchyText.js";
import BrandLogo from "../components/BrandLogo.jsx";
import SolarResourceLibraryAdmin from "../components/SolarResourceLibraryAdmin.jsx";
import MarketplaceVendorAdmin from "../components/MarketplaceVendorAdmin.jsx";
import WriPartnershipAdmin from "../components/WriPartnershipAdmin.jsx";
import { categories } from "../data/formOptions.js";
import {
  downloadSubmissionsJson,
  downloadSubmissionsExcel,
  formatSubmissionCoverage,
  formatSubmissionCounties,
  formatSubmissionLicenses,
  formatSubmissionRowText,
  printSubmissionsPdf
} from "../lib/submissionAdmin.js";

const storageKey = "kerea-admin-token";
const animationOptions = ["none", "pulse", "float", "shake", "breathe"];
const heroCtaAnimationOptions = ["white-line", "breathe", "shake", "pulse", "float", "none"];
const loadAnimationOptions = ["none", "rise", "stagger"];
const pageLoadAnimationOptions = ["fade", "pop", "bounce", "rotate", "shake", "none"];
const appearanceColorPresets = {
  original: {
    palette: "sky",
    primary: "#2563eb",
    primaryDeep: "#1d4ed8",
    primarySoft: "#dbeafe",
    accent: "#eff6ff",
    accentStrong: "#1e3a8a",
    pageBackground: "#f8fbff",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#f3f8ff",
    fieldBackground: "#f8fbff",
    guidanceBackground: "#eaf5ff",
    guidanceCardBackground: "#ffffff",
    guidanceBorderColor: "#bfdbfe",
    headerBackground: "rgba(255, 255, 255, 0.92)",
    footerBackground: "#ffffff",
    footerTextColor: "#0f172a",
    footerMutedTextColor: "#475569",
    footerButtonBackground: "#ffffff",
    footerButtonTextColor: "#0f172a",
    ctaTraceColor: "#ffffff",
    ctaTraceAccent: "#dbeafe",
    borderColor: "#dbeafe",
    textColor: "#0f172a",
    mutedTextColor: "#475569"
  },
  green: {
    palette: "forest",
    primary: "#15803d",
    primaryDeep: "#14532d",
    primarySoft: "#dcfce7",
    accent: "#ecfdf5",
    accentStrong: "#064e3b",
    pageBackground: "#f7fbf8",
    pageBackgroundAlt: "#ffffff",
    surfaceBackground: "#ffffff",
    surfaceMuted: "#f0fdf4",
    fieldBackground: "#f7fff9",
    guidanceBackground: "#e8f8ed",
    guidanceCardBackground: "#f8fff9",
    guidanceBorderColor: "#9ae6b4",
    headerBackground: "rgba(255, 255, 255, 0.94)",
    footerBackground: "#f8fff9",
    footerTextColor: "#052e16",
    footerMutedTextColor: "#3f5f46",
    footerButtonBackground: "#ffffff",
    footerButtonTextColor: "#14532d",
    ctaTraceColor: "#ffffff",
    ctaTraceAccent: "#bbf7d0",
    borderColor: "#bbf7d0",
    textColor: "#0b1f13",
    mutedTextColor: "#3f5f46"
  }
};

const toMultiline = (items, fallback) => (items && items.length ? items : fallback).join("\n");
const serializeFooterLinks = (links = []) =>
  links.map((link) => `${link.label || ""} | ${link.href || ""}`).join("\n");

const createEditorState = (settings) => ({
  brandName: settings.brandName,
  supportLabel: settings.supportLabel,
  heroBadge: settings.heroBadge,
  heroTitle: settings.heroTitle,
  heroDescription: settings.heroDescription,
  heroPrimaryCta: settings.heroPrimaryCta,
  heroSecondaryCta: settings.heroSecondaryCta,
  formPageTitle: settings.formPageTitle,
  formPageDescription: settings.formPageDescription,
  formBanner: settings.formBanner,
  whyItMattersTitle: settings.whyItMattersTitle,
  whyItMattersBody: settings.whyItMattersBody,
  successTitle: settings.successTitle,
  successBodyConsented: settings.successBodyConsented,
  successBodyDeclined: settings.successBodyDeclined,
  footerEnabled: settings.footer?.enabled ?? defaultSiteSettings.footer.enabled,
  footerLayout: settings.footer?.layout || defaultSiteSettings.footer.layout,
  footerTitle: settings.footer?.title || defaultSiteSettings.footer.title,
  footerBody: settings.footer?.body || settings.footer?.description || defaultSiteSettings.footer.body,
  footerLinksText: serializeFooterLinks(
    settings.footer?.links?.length
      ? settings.footer.links
      : [
          { label: settings.footer?.primaryLinkLabel, href: settings.footer?.primaryLinkHref },
          { label: settings.footer?.secondaryLinkLabel, href: settings.footer?.secondaryLinkHref }
        ].filter((link) => link.label && link.href).length
        ? [
            { label: settings.footer?.primaryLinkLabel, href: settings.footer?.primaryLinkHref },
            { label: settings.footer?.secondaryLinkLabel, href: settings.footer?.secondaryLinkHref }
          ].filter((link) => link.label && link.href)
        : defaultSiteSettings.footer.links
  ),
  footerNote: settings.footer?.note || settings.footer?.copyright || defaultSiteSettings.footer.note,
  footerSupportTitle: settings.footer?.supportTitle || defaultSiteSettings.footer.supportTitle,
  footerSupportPhone: settings.footer?.supportPhone || "",
  footerSupportEmail: settings.footer?.supportEmail || "",
  logoUrl: settings.branding?.logoUrl || "",
  logoAlt: settings.branding?.logoAlt || defaultSiteSettings.branding.logoAlt,
  faviconUrl: settings.branding?.faviconUrl || "",
  browserTitle: settings.branding?.browserTitle || defaultSiteSettings.branding.browserTitle,
  heroStats: (settings.heroStats?.length ? settings.heroStats : defaultSiteSettings.heroStats).map((item) => ({
    value: item.value || "",
    label: item.label || ""
  })),
  highlightsText: toMultiline(settings.landingHighlights, defaultSiteSettings.landingHighlights),
  tipsText: toMultiline(settings.formTips, defaultSiteSettings.formTips),
  howItWorksTitle: settings.howItWorksTitle || defaultSiteSettings.howItWorksTitle,
  howItWorksSteps: (settings.howItWorksSteps?.length ? settings.howItWorksSteps : defaultSiteSettings.howItWorksSteps).map((item) => ({
    title: item.title || "",
    body: item.body || ""
  })),
  locationHierarchyText: serializeLocationHierarchy(settings.locationHierarchy || defaultLocationHierarchy),
  palette: settings.theme.palette,
  heroLayout: settings.theme.heroLayout,
  backgroundStyle: settings.theme.backgroundStyle,
  pattern: settings.theme.pattern,
  patternsEnabled: settings.theme.patternsEnabled,
  patternMotion: settings.theme.patternMotion,
  mobileBackgroundStyle: settings.theme.mobileBackgroundStyle || settings.theme.backgroundStyle,
  desktopBackgroundStyle: settings.theme.desktopBackgroundStyle || settings.theme.backgroundStyle,
  mobilePattern: settings.theme.mobilePattern || settings.theme.pattern,
  desktopPattern: settings.theme.desktopPattern || settings.theme.pattern,
  mobilePatternsEnabled: settings.theme.mobilePatternsEnabled ?? settings.theme.patternsEnabled,
  desktopPatternsEnabled: settings.theme.desktopPatternsEnabled ?? settings.theme.patternsEnabled,
  mobilePatternMotion: settings.theme.mobilePatternMotion ?? settings.theme.patternMotion,
  desktopPatternMotion: settings.theme.desktopPatternMotion ?? settings.theme.patternMotion,
  mobileCtaTrace: settings.theme.mobileCtaTrace ?? settings.theme.mobileCtaTraceEnabled ?? true,
  desktopCtaTrace: settings.theme.desktopCtaTrace ?? settings.theme.desktopCtaTraceEnabled ?? true,
  mobileCtaAnimation: settings.theme.mobileCtaAnimation || settings.theme.mobileCtaMotion || "pulse",
  desktopCtaAnimation: settings.theme.desktopCtaAnimation || settings.theme.desktopCtaMotion || "pulse",
  heroCtaAnimation: settings.theme.heroCtaAnimation || "white-line",
  mobileHeroAnimation: settings.theme.mobileHeroAnimation || settings.theme.mobileBrandMotion || "float",
  desktopHeroAnimation: settings.theme.desktopHeroAnimation || settings.theme.desktopBrandMotion || "shake",
  mobileLoadAnimation: settings.theme.mobileLoadAnimation || settings.theme.mobileSurfaceMotion || "rise",
  desktopLoadAnimation: settings.theme.desktopLoadAnimation || settings.theme.desktopSurfaceMotion || "stagger",
  ctaPulse: settings.theme.ctaPulse,
  formTipsLayout: settings.theme.formTipsLayout,
  mobileHeaderSize: settings.theme.mobileHeaderSize || "large",
  desktopHeroTitleFontSize: normalizeDesktopHeroTitleFontSize(settings.theme.desktopHeroTitleFontSize),
  desktopHomepageScale: normalizeDesktopHomepageScale(
    settings.theme.desktopHomepageScale,
    legacyDesktopHomepageScale[settings.theme.desktopHomepageSize] || 115
  ),
  mobilePageLoadEnabled: settings.theme.mobilePageLoadEnabled ?? true,
  desktopPageLoadEnabled: settings.theme.desktopPageLoadEnabled ?? true,
  mobilePageLoadAnimation: settings.theme.mobilePageLoadAnimation || "pop",
  desktopPageLoadAnimation: settings.theme.desktopPageLoadAnimation || "fade",
  primary: settings.theme.colors?.primary || defaultSiteSettings.theme.colors.primary,
  primaryDeep: settings.theme.colors?.primaryDeep || defaultSiteSettings.theme.colors.primaryDeep,
  primarySoft: settings.theme.colors?.primarySoft || defaultSiteSettings.theme.colors.primarySoft,
  accent: settings.theme.colors?.accent || defaultSiteSettings.theme.colors.accent,
  accentStrong: settings.theme.colors?.accentStrong || defaultSiteSettings.theme.colors.accentStrong,
  pageBackground: settings.theme.colors?.pageBackground || defaultSiteSettings.theme.colors.pageBackground,
  pageBackgroundAlt: settings.theme.colors?.pageBackgroundAlt || defaultSiteSettings.theme.colors.pageBackgroundAlt,
  surfaceBackground: settings.theme.colors?.surfaceBackground || defaultSiteSettings.theme.colors.surfaceBackground,
  surfaceMuted: settings.theme.colors?.surfaceMuted || defaultSiteSettings.theme.colors.surfaceMuted,
  fieldBackground: settings.theme.colors?.fieldBackground || defaultSiteSettings.theme.colors.fieldBackground,
  guidanceBackground: settings.theme.colors?.guidanceBackground || defaultSiteSettings.theme.colors.guidanceBackground || defaultSiteSettings.theme.colors.surfaceMuted,
  guidanceCardBackground: settings.theme.colors?.guidanceCardBackground || defaultSiteSettings.theme.colors.guidanceCardBackground || defaultSiteSettings.theme.colors.surfaceBackground,
  guidanceBorderColor: settings.theme.colors?.guidanceBorderColor || defaultSiteSettings.theme.colors.guidanceBorderColor || defaultSiteSettings.theme.colors.borderColor,
  headerBackground: settings.theme.colors?.headerBackground || defaultSiteSettings.theme.colors.headerBackground,
  footerBackground: settings.theme.colors?.footerBackground || defaultSiteSettings.theme.colors.footerBackground,
  footerTextColor: settings.theme.colors?.footerTextColor || defaultSiteSettings.theme.colors.footerTextColor,
  footerMutedTextColor: settings.theme.colors?.footerMutedTextColor || defaultSiteSettings.theme.colors.footerMutedTextColor,
  footerButtonBackground: settings.theme.colors?.footerButtonBackground || defaultSiteSettings.theme.colors.footerButtonBackground,
  footerButtonTextColor: settings.theme.colors?.footerButtonTextColor || defaultSiteSettings.theme.colors.footerButtonTextColor,
  ctaTraceColor: settings.theme.colors?.ctaTraceColor || defaultSiteSettings.theme.colors.ctaTraceColor || "#ffffff",
  ctaTraceAccent: settings.theme.colors?.ctaTraceAccent || defaultSiteSettings.theme.colors.ctaTraceAccent || defaultSiteSettings.theme.colors.primarySoft,
  borderColor: settings.theme.colors?.borderColor || defaultSiteSettings.theme.colors.borderColor,
  textColor: settings.theme.colors?.textColor || defaultSiteSettings.theme.colors.textColor,
  mutedTextColor: settings.theme.colors?.mutedTextColor || defaultSiteSettings.theme.colors.mutedTextColor
});

const normalizeLines = (value, fallback) => {
  const items = `${value || ""}`
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : fallback;
};

const parseFooterLinks = (value) =>
  `${value || ""}`
    .split("\n")
    .map((line) => {
      const [label = "", href = ""] = line.split("|").map((item) => item.trim());
      return { label, href };
    })
    .filter((link) => link.label && link.href);

const legacyDesktopHomepageScale = {
  normal: 100,
  large: 115,
  xl: 135
};

const normalizeDesktopHomepageScale = (value, fallback = 115) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(180, Math.max(70, Math.round(numericValue)));
};

const normalizeDesktopHeroTitleFontSize = (value, fallback = 48) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(96, Math.max(24, Math.round(numericValue)));
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "branding", label: "Branding" },
  { id: "content", label: "Page content" },
  { id: "locations", label: "Locations" },
  { id: "appearance", label: "Appearance" },
  { id: "responses", label: "Responses" },
  { id: "solar-mkononi", label: "Solar Mkononi" },
  { id: "resource-library", label: "Resource library" },
  { id: "marketplace", label: "Marketplace vendors" },
  { id: "wri", label: "WRI Partnership" }
];

const cardClass = "rounded-[28px] border p-5 shadow-sm";

const getDisplayLines = (text) => {
  const normalizedText = `${text || "-"}`;
  const lines = normalizedText
    .split(/\n|\s+\|\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return lines.length ? lines : ["-"];
};

const initialResponseFilters = {
  search: "",
  consent: "all",
  category: "all",
  county: "",
  coverage: "",
  sortBy: "created_at",
  sortDirection: "desc"
};

const AdminConsolePage = () => {
  const location = useLocation();
  const { palette, refreshSettings, setSettings, settings } = useSiteSettings();
  const [token, setToken] = useState(() => localStorage.getItem(storageKey) || "");
  const [password, setPassword] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [editorState, setEditorState] = useState(() => createEditorState(settings));
  const [expandedTableCells, setExpandedTableCells] = useState({});
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [responseFilters, setResponseFilters] = useState(initialResponseFilters);
  const [solarMkononiSettings, setSolarMkononiSettings] = useState(null);
  const [solarMkononiEditor, setSolarMkononiEditor] = useState(null);
  const [savingSolarMkononi, setSavingSolarMkononi] = useState(false);
  const [solarMkononiSubTab, setSolarMkononiSubTab] = useState("hero");

  const gatedEmail = useMemo(() => {
    const fromState = location.state?.prefillEmail || "";
    const fromSession = getAdminAccess()?.email || "";
    return fromState || fromSession;
  }, [location.state]);

  const hasHiddenGate = Boolean(location.state?.gate === "hidden" || getAdminAccess()?.email || token);

  const loadSubmissions = async (authToken) => {
    setLoading(true);
    setError("");

    try {
      const data = await getSubmissions(authToken);
      setSubmissions(data.submissions || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load submissions.");
      if (requestError.status === 401) {
        localStorage.removeItem(storageKey);
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditorState(createEditorState(settings));
  }, [settings]);

  useEffect(() => {
    if (token) {
      loadSubmissions(token);
    }
  }, [token]);

  const loadSolarMkononiSettings = async () => {
    try {
      const data = await getSolarMkononiSettings();
      setSolarMkononiSettings(data.settings);
      setSolarMkononiEditor(data.settings);
    } catch (error) {
      console.error("Failed to load Solar Mkononi settings:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "solar-mkononi" && !solarMkononiSettings) {
      loadSolarMkononiSettings();
    }
  }, [activeTab]);

  const stats = useMemo(() => {
    const listed = submissions.filter((item) => item.consent).length;
    const declined = submissions.length - listed;

    return [
      { label: "Total submissions", value: submissions.length },
      { label: "Consented", value: listed },
      { label: "Declined", value: declined }
    ];
  }, [submissions]);

  const responseCategoryOptions = useMemo(() => {
    const dynamicOptions = submissions
      .flatMap((submission) => getDisplayLines(submission.category || submission.decline_reason || ""))
      .filter((item) => item && item !== "-");

    return [...new Set([...categories, ...dynamicOptions])].sort((a, b) => a.localeCompare(b));
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const searchNeedle = responseFilters.search.trim().toLowerCase();
    const countyNeedle = responseFilters.county.trim().toLowerCase();
    const coverageNeedle = responseFilters.coverage.trim().toLowerCase();

    const filtered = submissions.filter((submission) => {
      const categoryText = submission.category || submission.decline_reason || "";
      const countyText = formatSubmissionCounties(submission);
      const coverageText = formatSubmissionCoverage(submission);
      const rowText = formatSubmissionRowText(submission).toLowerCase();

      if (responseFilters.consent === "yes" && !submission.consent) {
        return false;
      }

      if (responseFilters.consent === "no" && submission.consent) {
        return false;
      }

      if (responseFilters.category !== "all" && !categoryText.toLowerCase().includes(responseFilters.category.toLowerCase())) {
        return false;
      }

      if (countyNeedle && !countyText.toLowerCase().includes(countyNeedle)) {
        return false;
      }

      if (coverageNeedle && !coverageText.toLowerCase().includes(coverageNeedle)) {
        return false;
      }

      if (searchNeedle && !rowText.includes(searchNeedle)) {
        return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const direction = responseFilters.sortDirection === "asc" ? 1 : -1;
      const sortValue = (submission) => {
        if (responseFilters.sortBy === "date") {
          return new Date(submission.created_at).toISOString().slice(0, 10);
        }

        if (responseFilters.sortBy === "time") {
          return new Date(submission.created_at).getTime();
        }

        return new Date(submission.created_at).getTime();
      };

      const first = sortValue(a);
      const second = sortValue(b);

      if (first < second) {
        return -1 * direction;
      }

      if (first > second) {
        return 1 * direction;
      }

      return 0;
    });
  }, [responseFilters, submissions]);

  const locationPreview = useMemo(() => {
    try {
      const hierarchy = parseLocationHierarchyText(editorState.locationHierarchyText);

      return {
        hierarchy,
        stats: buildLocationHierarchyStats(hierarchy),
        counties: getCountyPreviewRows(hierarchy, 10),
        error: ""
      };
    } catch (parseError) {
      return {
        hierarchy: null,
        stats: buildLocationHierarchyStats(defaultLocationHierarchy),
        counties: [],
        error: parseError.message || "Unable to read the location hierarchy text."
      };
    }
  }, [editorState.locationHierarchyText]);

  const applyEditorChange = (field, value) => {
    setEditorState((current) => ({ ...current, [field]: value }));
  };

  const applyAppearancePreset = (preset) => {
    const colors = appearanceColorPresets[preset];

    if (!colors) {
      return;
    }

    setEditorState((current) => ({
      ...current,
      ...colors
    }));
  };
 
   const updateEditorListItem = (field, index, key, value) => {
     setEditorState((current) => ({
       ...current,
       [field]: current[field].map((item, itemIndex) =>
         itemIndex === index ? { ...item, [key]: value } : item
       )
     }));
   };
 
   const addEditorListItem = (field, template) => {
     setEditorState((current) => ({
       ...current,
       [field]: [...current[field], template]
     }));
   };
 
   const removeEditorListItem = (field, index) => {
     setEditorState((current) => ({
       ...current,
       [field]: current[field].filter((_, itemIndex) => itemIndex !== index)
     }));
   };

   const toggleTableCell = (cellId) => {
     setExpandedTableCells((current) => ({
       ...current,
       [cellId]: !current[cellId]
     }));
   };

  const readImageAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(`${reader.result || ""}`);
      reader.onerror = () => reject(new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });

  const handlePartnerLogoUpload = async (index, event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const applyUrl = (url) => {
      const newLogos = [...(solarMkononiEditor.partners?.logos || [])];
      newLogos[index] = { ...newLogos[index], url };
      setSolarMkononiEditor({
        ...solarMkononiEditor,
        partners: { ...solarMkononiEditor.partners, logos: newLogos }
      });
    };

    try {
      if (token) {
        const uploadResult = await uploadAdminMedia(token, file);
        applyUrl(uploadResult.url);
        setNotice("Logo uploaded to Cloudinary.");
      } else {
        const dataUrl = await readImageAsDataUrl(file);
        applyUrl(dataUrl);
      }
    } catch (uploadError) {
      try {
        const dataUrl = await readImageAsDataUrl(file);
        applyUrl(dataUrl);
        setError(`${uploadError.message || "Cloudinary upload failed."} Using a local preview until Cloudinary is configured.`);
      } catch {
        setError(uploadError.message || "Unable to read the logo file.");
      }
    }
  };

  const handleImageUpload = async (field, event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      if (token) {
        const uploadResult = await uploadAdminMedia(token, file);
        applyEditorChange(field, uploadResult.url);
        setNotice("Image uploaded to Cloudinary.");
      } else {
        const dataUrl = await readImageAsDataUrl(file);
        applyEditorChange(field, dataUrl);
      }
    } catch (uploadError) {
      try {
        const dataUrl = await readImageAsDataUrl(file);
        applyEditorChange(field, dataUrl);
        setError(`${uploadError.message || "Cloudinary upload failed."} Using a local preview until Cloudinary is configured.`);
      } catch {
        setError(uploadError.message || "Unable to read the image file.");
      }
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthenticating(true);
    setError("");

    try {
      const data = await adminLogin({ email: gatedEmail, password });
      grantAdminAccess(gatedEmail);
      localStorage.setItem(storageKey, data.token);
      setToken(data.token);
      setPassword("");
    } catch (requestError) {
      setError(requestError.message || "Login failed.");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    clearAdminAccess();
    setToken("");
    setSubmissions([]);
    setPassword("");
  };

  const updateResponseFilter = (field, value) => {
    setResponseFilters((current) => ({ ...current, [field]: value }));
  };

  const resetResponseFilters = () => {
    setResponseFilters(initialResponseFilters);
  };

  const handleExport = async (format = "excel") => {
    try {
      if (format === "json") {
        downloadSubmissionsJson(filteredSubmissions);
        setNotice("JSON export downloaded.");
        return;
      }

      if (format === "pdf") {
        printSubmissionsPdf(filteredSubmissions);
        setNotice("PDF report opened. Choose Save as PDF in the print dialog.");
        return;
      }

      downloadSubmissionsExcel(filteredSubmissions);
      setNotice("Excel export downloaded.");
    } catch (requestError) {
      setError(requestError.message || "Export failed.");
    }
  };

  const handleCopySubmission = async (submission) => {
    try {
      await navigator.clipboard.writeText(formatSubmissionRowText(submission));
      setNotice(`Copied ${submission.email || "submission"}.`);
    } catch {
      setError("Unable to copy this response row.");
    }
  };

  const handleCopyAllSubmissions = async () => {
    const rows = filteredSubmissions.map((submission, index) =>
      [
        `Response ${index + 1}`,
        formatSubmissionRowText(submission)
      ].join("\n")
    );

    try {
      await navigator.clipboard.writeText(rows.join("\n\n------------------------------\n\n"));
      setNotice(`Copied ${filteredSubmissions.length} response${filteredSubmissions.length === 1 ? "" : "s"}.`);
    } catch {
      setError("Unable to copy all responses.");
    }
  };

  const handleDeleteSubmission = async (id) => {
    try {
      await deleteSubmission(token, id);
      setSubmissions((current) => current.filter((s) => s.id !== id));
      setConfirmingDelete(null);
      setNotice("Submission deleted.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete submission.");
      setConfirmingDelete(null);
    }
  };

  const handleSaveSolarMkononiSettings = async () => {
    setSavingSolarMkononi(true);
    setError("");

    try {
      const updated = await updateSolarMkononiSettings(token, solarMkononiEditor);
      setSolarMkononiSettings(updated.settings);
      setSolarMkononiEditor(updated.settings);
      setNotice("Solar Mkononi settings saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save Solar Mkononi settings.");
    } finally {
      setSavingSolarMkononi(false);
    }
  };

  const handleResetSolarMkononiSettings = async () => {
    setSavingSolarMkononi(true);
    setError("");

    try {
      const updated = await resetSolarMkononiSettings(token);
      setSolarMkononiSettings(updated.settings);
      setSolarMkononiEditor(updated.settings);
      setNotice("Solar Mkononi settings reset to defaults.");
    } catch (requestError) {
      setError(requestError.message || "Unable to reset Solar Mkononi settings.");
    } finally {
      setSavingSolarMkononi(false);
    }
  };

  const renderLimitedCell = (submissionId, field, value, options = {}) => {
    const lines = getDisplayLines(value);
    const text = lines.join("\n");
    const cellId = `${submissionId}-${field}`;
    const expanded = Boolean(expandedTableCells[cellId]);
    const collapsedLineCount = options.collapsedLineCount || 6;
    const shouldCollapse = lines.length > collapsedLineCount || text.length > 150;
    const collapsedStyle = expanded
      ? {}
      : {
          maxHeight: `${collapsedLineCount * 1.35}rem`,
          overflow: "hidden"
        };

    return (
      <div className="max-w-xs rounded-2xl border px-3 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted, color: palette.textColor }}>
        <div className="space-y-1 break-words leading-[1.35]" style={collapsedStyle}>
          {lines.map((line, index) => (
            <div key={`${cellId}-${index}`}>{line}</div>
          ))}
        </div>
        {shouldCollapse ? (
          <button
            type="button"
            onClick={() => setExpandedTableCells((current) => ({ ...current, [cellId]: !expanded }))}
            className="mt-3 text-sm font-semibold"
            style={{ color: palette.primary }}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
    );
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setError("");
    setNotice("");

    let parsedLocationHierarchy = settings.locationHierarchy || defaultLocationHierarchy;
    let locationWarning = "";

    try {
      parsedLocationHierarchy = parseLocationHierarchyText(editorState.locationHierarchyText);
    } catch (parseError) {
      locationWarning = parseError.message || "The location hierarchy was not updated because it has a formatting error.";
    }

    const payload = {
      brandName: editorState.brandName.trim(),
      supportLabel: editorState.supportLabel.trim(),
      heroBadge: editorState.heroBadge.trim(),
      heroTitle: editorState.heroTitle.trim(),
      heroDescription: editorState.heroDescription.trim(),
      heroPrimaryCta: editorState.heroPrimaryCta.trim(),
      heroSecondaryCta: editorState.heroSecondaryCta.trim(),
      formPageTitle: editorState.formPageTitle.trim(),
      formPageDescription: editorState.formPageDescription.trim(),
      formBanner: editorState.formBanner.trim(),
      whyItMattersTitle: editorState.whyItMattersTitle.trim(),
      whyItMattersBody: editorState.whyItMattersBody.trim(),
      successTitle: editorState.successTitle.trim(),
      successBodyConsented: editorState.successBodyConsented.trim(),
      successBodyDeclined: editorState.successBodyDeclined.trim(),
      footer: {
        enabled: editorState.footerEnabled,
        layout: editorState.footerLayout,
        title: editorState.footerTitle.trim(),
        body: editorState.footerBody.trim(),
        links: parseFooterLinks(editorState.footerLinksText),
        note: editorState.footerNote.trim(),
        supportTitle: editorState.footerSupportTitle.trim(),
        supportPhone: editorState.footerSupportPhone.trim(),
        supportEmail: editorState.footerSupportEmail.trim()
      },
      branding: {
        logoUrl: editorState.logoUrl.trim(),
        logoAlt: editorState.logoAlt.trim(),
        faviconUrl: editorState.faviconUrl.trim(),
        browserTitle: editorState.browserTitle.trim()
      },
      heroStats: editorState.heroStats
        .map((item) => ({ value: item.value.trim(), label: item.label.trim() }))
        .filter((item) => item.value || item.label),
      landingHighlights: normalizeLines(editorState.highlightsText, defaultSiteSettings.landingHighlights),
      formTips: normalizeLines(editorState.tipsText, defaultSiteSettings.formTips),
      howItWorksTitle: editorState.howItWorksTitle.trim(),
      howItWorksSteps: editorState.howItWorksSteps
        .map((item) => ({ title: item.title.trim(), body: item.body.trim() }))
        .filter((item) => item.title || item.body),
      locationHierarchy: parsedLocationHierarchy,
      theme: {
        palette: editorState.palette,
        heroLayout: editorState.heroLayout,
        backgroundStyle: editorState.backgroundStyle,
        pattern: editorState.pattern,
        patternsEnabled: editorState.patternsEnabled,
        patternMotion: editorState.patternMotion,
        mobileBackgroundStyle: editorState.mobileBackgroundStyle,
        desktopBackgroundStyle: editorState.desktopBackgroundStyle,
        mobilePattern: editorState.mobilePattern,
        desktopPattern: editorState.desktopPattern,
        mobilePatternsEnabled: editorState.mobilePatternsEnabled,
        desktopPatternsEnabled: editorState.desktopPatternsEnabled,
        mobilePatternMotion: editorState.mobilePatternMotion,
        desktopPatternMotion: editorState.desktopPatternMotion,
        mobileCtaTrace: editorState.mobileCtaTrace,
        desktopCtaTrace: editorState.desktopCtaTrace,
        mobileCtaAnimation: editorState.mobileCtaAnimation,
        desktopCtaAnimation: editorState.desktopCtaAnimation,
        heroCtaAnimation: editorState.heroCtaAnimation,
        mobileHeroAnimation: editorState.mobileHeroAnimation,
        desktopHeroAnimation: editorState.desktopHeroAnimation,
        mobileLoadAnimation: editorState.mobileLoadAnimation,
        desktopLoadAnimation: editorState.desktopLoadAnimation,
        ctaPulse: editorState.ctaPulse,
        formTipsLayout: editorState.formTipsLayout,
        mobileHeaderSize: editorState.mobileHeaderSize,
        desktopHeroTitleFontSize: normalizeDesktopHeroTitleFontSize(editorState.desktopHeroTitleFontSize),
        desktopHomepageScale: normalizeDesktopHomepageScale(editorState.desktopHomepageScale),
        mobilePageLoadEnabled: editorState.mobilePageLoadEnabled,
        desktopPageLoadEnabled: editorState.desktopPageLoadEnabled,
        mobilePageLoadAnimation: editorState.mobilePageLoadAnimation,
        desktopPageLoadAnimation: editorState.desktopPageLoadAnimation,
        colors: {
          primary: editorState.primary,
          primaryDeep: editorState.primaryDeep,
          primarySoft: editorState.primarySoft,
          primaryGlow: `${editorState.primary}33`,
          textOnPrimary: "#ffffff",
          accent: editorState.accent,
          accentStrong: editorState.accentStrong,
          pageBackground: editorState.pageBackground,
          pageBackgroundAlt: editorState.pageBackgroundAlt,
          surfaceBackground: editorState.surfaceBackground,
          surfaceMuted: editorState.surfaceMuted,
          fieldBackground: editorState.fieldBackground,
          guidanceBackground: editorState.guidanceBackground,
          guidanceCardBackground: editorState.guidanceCardBackground,
          guidanceBorderColor: editorState.guidanceBorderColor,
          headerBackground: editorState.headerBackground,
          footerBackground: editorState.footerBackground,
          footerTextColor: editorState.footerTextColor,
          footerMutedTextColor: editorState.footerMutedTextColor,
          footerButtonBackground: editorState.footerButtonBackground,
          footerButtonTextColor: editorState.footerButtonTextColor,
          ctaTraceColor: editorState.ctaTraceColor,
          ctaTraceAccent: editorState.ctaTraceAccent,
          borderColor: editorState.borderColor,
          textColor: editorState.textColor,
          mutedTextColor: editorState.mutedTextColor
        }
      }
    };

    try {
      const data = await updateSiteSettings(token, payload);
      setSettings(data.settings);
      await refreshSettings();
      setNotice(locationWarning ? `Changes saved, but locations were not updated: ${locationWarning}` : "Changes saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    setSavingSettings(true);
    setError("");
    setNotice("");

    try {
      const data = await resetSiteSettings(token);
      setSettings(data.settings);
      await refreshSettings();
      setNotice("Settings reset to defaults.");
    } catch (requestError) {
      setError(requestError.message || "Unable to reset settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (!token && !hasHiddenGate) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ backgroundColor: palette.pageBackground }}>
        <div className="w-full max-w-xl rounded-[32px] border p-8 shadow-soft" style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
          <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
            Hidden admin access
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight" style={{ color: palette.textColor }}>Access path is not public</h1>
          <p className="mt-3 text-sm leading-6" style={{ color: palette.mutedTextColor }}>
            To open the admin panel, start from the listing form, enter the admin email, choose “No, I prefer not to be listed”, and continue.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/form" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: palette.primary }}>
              Go to form
            </Link>
            <Link to="/" className="inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ backgroundColor: palette.pageBackground }}>
        <div className="w-full max-w-md rounded-[32px] border p-8 shadow-soft" style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
          <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>Hidden admin access</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight" style={{ color: palette.textColor }}>Enter password</h1>
          <p className="mt-3 text-sm leading-6" style={{ color: palette.mutedTextColor }}>
            Hidden access was detected from the form. Continue with your admin password.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <input type="email" value={gatedEmail} readOnly className="w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted, color: palette.mutedTextColor }} />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" className="w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} autoComplete="current-password" />
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            <button type="submit" disabled={authenticating} className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300" style={{ backgroundColor: authenticating ? "#cbd5e1" : palette.primary }}>
              {authenticating ? "Signing in..." : "Open admin panel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: palette.pageBackground }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border p-6 shadow-soft" style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <BrandLogo size="lg" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>Site control center</div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight" style={{ color: palette.textColor }}>Hidden admin dashboard</h1>
                <p className="mt-2 text-sm" style={{ color: palette.mutedTextColor }}>
                  Use the menu to manage branding, page text, appearance, and responses without everything being on one screen.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveSettings(); }} disabled={savingSettings} className="rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300" style={{ backgroundColor: savingSettings ? "#cbd5e1" : palette.primary }}>
                {savingSettings ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); }} className="rounded-2xl border px-5 py-3 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                Logout
              </button>
            </div>
          </div>
        </div>

        {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {notice ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-[32px] border p-4 shadow-soft" style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition"
                  style={{
                    backgroundColor: activeTab === tab.id ? palette.accent : palette.surfaceBackground,
                    color: activeTab === tab.id ? palette.primaryDeep : palette.textColor,
                    border: `1px solid ${activeTab === tab.id ? palette.borderColor : "transparent"}`
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="mt-6 rounded-[28px] border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
              <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Quick actions</div>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" onClick={handleResetSettings} className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                  Reset defaults
                </button>
                <button type="button" onClick={() => loadSubmissions(token)} className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                  Refresh submissions
                </button>
                <button type="button" onClick={handleExport} disabled={!filteredSubmissions.length} className="rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: palette.primary }}>
                  Export filtered Excel
                </button>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            {activeTab === "overview" ? (
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <section className={cardClass} style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
                  <h2 className="text-xl font-semibold" style={{ color: palette.textColor }}>Current site summary</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {stats.map((item) => (
                      <div key={item.label} className="rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                        <div className="text-sm" style={{ color: palette.mutedTextColor }}>{item.label}</div>
                        <div className="mt-2 text-3xl font-bold" style={{ color: palette.textColor }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className={cardClass} style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
                  <h2 className="text-xl font-semibold" style={{ color: palette.textColor }}>Brand preview</h2>
                  <div className="mt-6 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: editorState.pageBackgroundAlt }}>
                    <BrandLogo
                      size="lg"
                      showWordmark
                      brandName={editorState.brandName}
                      supportLabel={editorState.supportLabel}
                      logoUrl={editorState.logoUrl}
                      logoAlt={editorState.logoAlt}
                    />
                    <div className="mt-5 rounded-3xl px-5 py-4 text-sm font-semibold text-white" style={{ backgroundColor: editorState.primary }}>
                      {editorState.heroPrimaryCta}
                    </div>
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === "branding" ? (
              <section className={cardClass} style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
                <h2 className="text-2xl font-semibold" style={{ color: palette.textColor }}>Branding</h2>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Brand name
                      <input type="text" value={editorState.brandName} onChange={(event) => applyEditorChange("brandName", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Support label
                      <input type="text" value={editorState.supportLabel} onChange={(event) => applyEditorChange("supportLabel", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Browser tab title
                      <input type="text" value={editorState.browserTitle} onChange={(event) => applyEditorChange("browserTitle", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Logo alt text
                      <input type="text" value={editorState.logoAlt} onChange={(event) => applyEditorChange("logoAlt", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Logo URL or data URL
                      <textarea rows={4} value={editorState.logoUrl} onChange={(event) => applyEditorChange("logoUrl", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Favicon URL or data URL
                      <textarea rows={4} value={editorState.faviconUrl} onChange={(event) => applyEditorChange("faviconUrl", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Upload logo</div>
                      <input type="file" accept="image/*" onChange={(event) => handleImageUpload("logoUrl", event)} className="mt-3 block w-full text-sm" />
                    </div>
                    <div className="rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Upload favicon</div>
                      <input type="file" accept="image/*" onChange={(event) => handleImageUpload("faviconUrl", event)} className="mt-3 block w-full text-sm" />
                    </div>
                    <div className="rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: editorState.pageBackgroundAlt }}>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Preview</div>
                      <div className="mt-4 flex items-center justify-between rounded-3xl border px-4 py-4" style={{ borderColor: palette.borderColor, backgroundColor: editorState.headerBackground }}>
                        <BrandLogo
                          size="md"
                          showWordmark
                          brandName={editorState.brandName}
                          supportLabel={editorState.supportLabel}
                          logoUrl={editorState.logoUrl}
                          logoAlt={editorState.logoAlt}
                        />
                        <div className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: editorState.primary }}>
                          {editorState.heroPrimaryCta}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "resource-library" ? (
              <SolarResourceLibraryAdmin token={token} palette={palette} setNotice={setNotice} setError={setError} />
            ) : null}

            {activeTab === "marketplace" ? (
              <MarketplaceVendorAdmin token={token} />
            ) : null}

            {activeTab === "wri" ? (
              <WriPartnershipAdmin token={token} palette={palette} setNotice={setNotice} setError={setError} />
            ) : null}

            {activeTab === "content" ? (
              <section className={cardClass} style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
                <h2 className="text-2xl font-semibold" style={{ color: palette.textColor }}>Page content</h2>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    {[
                      ["heroBadge", "Hero badge"],
                      ["heroTitle", "Hero title"],
                      ["heroDescription", "Hero description"],
                      ["heroPrimaryCta", "Primary CTA"],
                      ["heroSecondaryCta", "Secondary CTA"],
                      ["formPageTitle", "Form page title"],
                      ["formPageDescription", "Form page description"],
                      ["formBanner", "Form banner"],
                      ["whyItMattersTitle", "Why it matters title"],
                      ["whyItMattersBody", "Why it matters body"],
                      ["successTitle", "Success title"],
                      ["successBodyConsented", "Success body for consented"],
                      ["successBodyDeclined", "Success body for declined"]
                    ].map(([field, label]) => (
                      <label key={field} className="block text-sm font-medium" style={{ color: palette.textColor }}>
                        {label}
                        <textarea rows={field.includes("Title") ? 2 : 4} value={editorState[field]} onChange={(event) => applyEditorChange(field, event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                      </label>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-3 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Homepage stat cards</div>
                          <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Add, update, or remove the stat cards shown under the hero section.</p>
                        </div>
                        <button type="button" onClick={() => addEditorListItem("heroStats", { value: "", label: "" })} className="rounded-2xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                          Add stat card
                        </button>
                      </div>
                      <div className="space-y-3">
                        {editorState.heroStats.map((item, index) => (
                          <div key={`stat-${index}`} className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_1fr_auto]" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                              Value
                              <input type="text" value={item.value} onChange={(event) => updateEditorListItem("heroStats", index, "value", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                            </label>
                            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                              Label
                              <input type="text" value={item.label} onChange={(event) => updateEditorListItem("heroStats", index, "label", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                            </label>
                            <div className="flex items-end">
                              <button type="button" onClick={() => removeEditorListItem("heroStats", index)} disabled={editorState.heroStats.length <= 1} className="rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Highlights
                      <textarea rows={6} value={editorState.highlightsText} onChange={(event) => applyEditorChange("highlightsText", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Form tips
                      <textarea rows={5} value={editorState.tipsText} onChange={(event) => applyEditorChange("tipsText", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                    </label>
                    <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Footer content</div>
                        <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Edit the public footer text, links, layout, or turn it off completely.</p>
                      </div>
                      <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                        Show footer
                        <input type="checkbox" checked={editorState.footerEnabled} onChange={(event) => applyEditorChange("footerEnabled", event.target.checked)} />
                      </label>
                      <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                        Footer layout
                        <select value={editorState.footerLayout} onChange={(event) => applyEditorChange("footerLayout", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                          <option value="columns">Columns</option>
                          <option value="split">Split</option>
                          <option value="stacked">Stacked</option>
                        </select>
                      </label>
                      <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                        Footer title
                        <input type="text" value={editorState.footerTitle} onChange={(event) => applyEditorChange("footerTitle", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                      </label>
                      <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                        Footer body
                        <textarea rows={3} value={editorState.footerBody} onChange={(event) => applyEditorChange("footerBody", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                      </label>
                      <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                        Footer links
                        <textarea rows={4} value={editorState.footerLinksText} onChange={(event) => applyEditorChange("footerLinksText", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 font-mono text-sm outline-none" style={{ borderColor: palette.borderColor }} />
                        <span className="mt-2 block text-xs" style={{ color: palette.mutedTextColor }}>Use one link per line: Label | /path-or-url</span>
                      </label>
                      <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                        Footer note
                        <input type="text" value={editorState.footerNote} onChange={(event) => applyEditorChange("footerNote", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                      </label>
                      <div className="grid gap-3 rounded-2xl border p-4 md:grid-cols-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Contact section title
                          <input type="text" value={editorState.footerSupportTitle} onChange={(event) => applyEditorChange("footerSupportTitle", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Support phone
                          <input type="text" value={editorState.footerSupportPhone} onChange={(event) => applyEditorChange("footerSupportPhone", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Support email
                          <input type="email" value={editorState.footerSupportEmail} onChange={(event) => applyEditorChange("footerSupportEmail", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                        </label>
                      </div>
                    </div>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      How it works title
                      <textarea rows={2} value={editorState.howItWorksTitle} onChange={(event) => applyEditorChange("howItWorksTitle", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                    </label>
                    <div className="space-y-3 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold" style={{ color: palette.textColor }}>How it works cards</div>
                          <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Add as many step cards as you need for the homepage.</p>
                        </div>
                        <button type="button" onClick={() => addEditorListItem("howItWorksSteps", { title: "", body: "" })} className="rounded-2xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                          Add step card
                        </button>
                      </div>
                      <div className="space-y-3">
                        {editorState.howItWorksSteps.map((item, index) => (
                          <div key={`step-${index}`} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                              Step title
                              <textarea rows={2} value={item.title} onChange={(event) => updateEditorListItem("howItWorksSteps", index, "title", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                            </label>
                            <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                              Step body
                              <textarea rows={3} value={item.body} onChange={(event) => updateEditorListItem("howItWorksSteps", index, "body", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                            </label>
                            <div className="flex justify-end">
                              <button type="button" onClick={() => removeEditorListItem("howItWorksSteps", index)} disabled={editorState.howItWorksSteps.length <= 1} className="rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "locations" ? (
              <section className={cardClass} style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold" style={{ color: palette.textColor }}>Locations</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: palette.mutedTextColor }}>
                      Paste or edit county, sub-county, and ward data in a simple text format. The public form will use this admin-managed hierarchy as its source of truth.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyEditorChange("locationHierarchyText", defaultLocationHierarchyText)}
                    className="rounded-2xl border px-4 py-3 text-sm font-semibold"
                    style={{ borderColor: palette.borderColor, color: palette.textColor }}
                  >
                    Restore default hierarchy
                  </button>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      County hierarchy text
                      <textarea
                        rows={28}
                        value={editorState.locationHierarchyText}
                        onChange={(event) => applyEditorChange("locationHierarchyText", event.target.value)}
                        className="mt-2 w-full rounded-2xl border px-4 py-3 font-mono text-sm outline-none"
                        style={{ borderColor: locationPreview.error ? "#f43f5e" : palette.borderColor }}
                      />
                    </label>
                    <div className="rounded-[28px] border p-4 text-sm" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted, color: palette.mutedTextColor }}>
                      Use this format: <span className="font-semibold">`1. County Name`</span> on one line, then <span className="font-semibold">`- Sub-county: Ward 1, Ward 2`</span> on the lines below it.
                    </div>
                    {locationPreview.error ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {locationPreview.error}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        The location hierarchy text is valid and ready to save.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                      {[
                        ["Counties", locationPreview.stats.countyCount],
                        ["Sub-counties", locationPreview.stats.subCountyCount],
                        ["Wards", locationPreview.stats.wardCount]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[24px] border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div className="text-sm" style={{ color: palette.mutedTextColor }}>{label}</div>
                          <div className="mt-2 text-3xl font-bold" style={{ color: palette.textColor }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Preview</div>
                      <div className="mt-4 space-y-3">
                        {locationPreview.counties.map((item) => (
                          <div key={item.county} className="rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <div className="text-sm font-semibold" style={{ color: palette.primaryDeep }}>{item.county}</div>
                            <div className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>
                              {item.subCountyCount} sub-counties, {item.wardCount} wards
                            </div>
                            <div className="mt-2 text-sm" style={{ color: palette.textColor }}>
                              {item.firstSubCounties.join(", ")}
                            </div>
                          </div>
                        ))}
                        {!locationPreview.counties.length && !locationPreview.error ? (
                          <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.mutedTextColor }}>
                            Paste county data to preview it here.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "appearance" ? (
              <section className={cardClass} style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
                <h2 className="text-2xl font-semibold" style={{ color: palette.textColor }}>Appearance</h2>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="rounded-[28px] border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>UI color preset</div>
                      <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>
                        Switch only the colors. Content, logo, media, responses, and layout stay unchanged.
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {appearancePresetOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => applyAppearancePreset(option)}
                            className="rounded-2xl border px-4 py-3 text-sm font-semibold capitalize transition hover:-translate-y-0.5"
                            style={{
                              borderColor: option === "green" ? "#86efac" : palette.borderColor,
                              backgroundColor: option === "green" ? "#ecfdf5" : palette.surfaceBackground,
                              color: option === "green" ? "#14532d" : palette.textColor
                            }}
                          >
                            {option === "green" ? "Green ecosystem" : "Original UI"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Color palette
                      <select value={editorState.palette} onChange={(event) => applyEditorChange("palette", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                        {paletteOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Hero layout
                      <select value={editorState.heroLayout} onChange={(event) => applyEditorChange("heroLayout", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                        <option value="split">Split</option>
                        <option value="stacked">Stacked</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Background style
                      <select value={editorState.backgroundStyle} onChange={(event) => applyEditorChange("backgroundStyle", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                        {backgroundOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Pattern
                      <select value={editorState.pattern} onChange={(event) => applyEditorChange("pattern", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                        {patternOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <div className="rounded-[28px] border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Mobile background animation</div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile background style
                          <select value={editorState.mobileBackgroundStyle} onChange={(event) => applyEditorChange("mobileBackgroundStyle", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {backgroundOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile pattern
                          <select value={editorState.mobilePattern} onChange={(event) => applyEditorChange("mobilePattern", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {patternOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {[
                          ["mobilePatternsEnabled", "Enable mobile patterns"],
                          ["mobilePatternMotion", "Animate mobile patterns"]
                        ].map(([field, label]) => (
                          <label key={field} className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                            {label}
                            <input type="checkbox" checked={editorState[field]} onChange={(event) => applyEditorChange(field, event.target.checked)} />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[28px] border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Mobile button, title, and card motion</div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Show animated CTA line on mobile
                          <input type="checkbox" checked={editorState.mobileCtaTrace} onChange={(event) => applyEditorChange("mobileCtaTrace", event.target.checked)} />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile CTA movement
                          <select value={editorState.mobileCtaAnimation} onChange={(event) => applyEditorChange("mobileCtaAnimation", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {animationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Homepage Start Form Now animation
                          <select value={editorState.heroCtaAnimation} onChange={(event) => applyEditorChange("heroCtaAnimation", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {heroCtaAnimationOptions.map((option) => <option key={option} value={option}>{option === "white-line" ? "White line around border" : option}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile hero title movement
                          <select value={editorState.mobileHeroAnimation} onChange={(event) => applyEditorChange("mobileHeroAnimation", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {animationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile card loading style
                          <select value={editorState.mobileLoadAnimation} onChange={(event) => applyEditorChange("mobileLoadAnimation", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {loadAnimationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile header size
                          <select value={editorState.mobileHeaderSize} onChange={(event) => applyEditorChange("mobileHeaderSize", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            <option value="compact">Compact</option>
                            <option value="large">Large</option>
                            <option value="xl">Extra large</option>
                          </select>
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable mobile page load style
                          <input type="checkbox" checked={editorState.mobilePageLoadEnabled} onChange={(event) => applyEditorChange("mobilePageLoadEnabled", event.target.checked)} />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile page load style
                          <select value={editorState.mobilePageLoadAnimation} onChange={(event) => applyEditorChange("mobilePageLoadAnimation", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {pageLoadAnimationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>
                    <div className="rounded-[28px] border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Desktop background animation</div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Desktop background style
                          <select value={editorState.desktopBackgroundStyle} onChange={(event) => applyEditorChange("desktopBackgroundStyle", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {backgroundOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Desktop pattern
                          <select value={editorState.desktopPattern} onChange={(event) => applyEditorChange("desktopPattern", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {patternOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {[
                          ["desktopPatternsEnabled", "Enable desktop patterns"],
                          ["desktopPatternMotion", "Animate desktop patterns"]
                        ].map(([field, label]) => (
                          <label key={field} className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                            {label}
                            <input type="checkbox" checked={editorState[field]} onChange={(event) => applyEditorChange(field, event.target.checked)} />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[28px] border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Desktop button, title, and card motion</div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Show animated CTA line on desktop
                          <input type="checkbox" checked={editorState.desktopCtaTrace} onChange={(event) => applyEditorChange("desktopCtaTrace", event.target.checked)} />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Desktop CTA movement
                          <select value={editorState.desktopCtaAnimation} onChange={(event) => applyEditorChange("desktopCtaAnimation", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {animationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Desktop hero title movement
                          <select value={editorState.desktopHeroAnimation} onChange={(event) => applyEditorChange("desktopHeroAnimation", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {animationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Desktop hero title font size (px)
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input type="number" min="24" max="96" step="1" value={editorState.desktopHeroTitleFontSize} onChange={(event) => applyEditorChange("desktopHeroTitleFontSize", event.target.value)} className="w-full bg-transparent outline-none" />
                            <span className="text-sm font-semibold" style={{ color: palette.mutedTextColor }}>px</span>
                          </div>
                          <span className="mt-2 block text-xs" style={{ color: palette.mutedTextColor }}>Controls only the main homepage title on desktop.</span>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Desktop card loading style
                          <select value={editorState.desktopLoadAnimation} onChange={(event) => applyEditorChange("desktopLoadAnimation", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {loadAnimationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable desktop page load style
                          <input type="checkbox" checked={editorState.desktopPageLoadEnabled} onChange={(event) => applyEditorChange("desktopPageLoadEnabled", event.target.checked)} />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Desktop homepage scale (%)
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input type="number" min="70" max="180" step="1" value={editorState.desktopHomepageScale} onChange={(event) => applyEditorChange("desktopHomepageScale", event.target.value)} className="w-full bg-transparent outline-none" />
                            <span className="text-sm font-semibold" style={{ color: palette.mutedTextColor }}>%</span>
                          </div>
                          <span className="mt-2 block text-xs" style={{ color: palette.mutedTextColor }}>Use any value from 70 to 180. This affects desktop homepage only.</span>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Desktop page load style
                          <select value={editorState.desktopPageLoadAnimation} onChange={(event) => applyEditorChange("desktopPageLoadAnimation", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                            {pageLoadAnimationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>
                    {[
                      ["patternsEnabled", "Enable background patterns"],
                      ["patternMotion", "Animate patterns"],
                      ["ctaPulse", "Pulse the start-form CTA"]
                    ].map(([field, label]) => (
                      <label key={field} className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                        {label}
                        <input type="checkbox" checked={editorState[field]} onChange={(event) => applyEditorChange(field, event.target.checked)} />
                      </label>
                    ))}
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Form tips layout
                      <select value={editorState.formTipsLayout} onChange={(event) => applyEditorChange("formTipsLayout", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }}>
                        <option value="row">Row</option>
                        <option value="stack">Stack</option>
                      </select>
                    </label>
                  </div>
                  <div className="space-y-4">
                    {[
                      ["primary", "Primary color"],
                      ["primaryDeep", "Primary deep"],
                      ["primarySoft", "Primary soft"],
                      ["accent", "Accent background"],
                      ["accentStrong", "Accent strong text"],
                      ["pageBackground", "Page background"],
                      ["pageBackgroundAlt", "Page background alt"],
                      ["surfaceBackground", "Surface background"],
                      ["surfaceMuted", "Surface muted"],
                      ["fieldBackground", "Input / answer box background"],
                      ["guidanceBackground", "Step guidance section background"],
                      ["guidanceCardBackground", "Step guidance card background"],
                      ["guidanceBorderColor", "Step guidance border color"],
                      ["headerBackground", "Header background"],
                      ["footerBackground", "Footer background"],
                      ["footerTextColor", "Footer text color"],
                      ["footerMutedTextColor", "Footer muted text color"],
                      ["footerButtonBackground", "Footer button background"],
                      ["footerButtonTextColor", "Footer button text color"],
                      ["ctaTraceColor", "CTA moving line color"],
                      ["ctaTraceAccent", "CTA moving line accent"],
                      ["borderColor", "Border color"],
                      ["textColor", "Text color"],
                      ["mutedTextColor", "Muted text color"]
                    ].map(([field, label]) => (
                      <label key={field} className="block text-sm font-medium" style={{ color: palette.textColor }}>
                        {label}
                        <div className="mt-2 flex items-center gap-3">
                          <input type="color" value={editorState[field].startsWith("#") ? editorState[field] : "#ffffff"} onChange={(event) => applyEditorChange(field, event.target.value)} className="h-12 w-14 rounded-xl border" style={{ borderColor: palette.borderColor }} />
                          <input type="text" value={editorState[field]} onChange={(event) => applyEditorChange(field, event.target.value)} className="w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor }} />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "responses" ? (
              <section className={cardClass} style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl font-semibold" style={{ color: palette.textColor }}>Responses</h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAllSubmissions}
                      disabled={!filteredSubmissions.length}
                      className="rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ borderColor: palette.borderColor, color: palette.textColor }}
                    >
                      Copy filtered responses
                    </button>
                    <button type="button" onClick={() => handleExport("json")} disabled={!filteredSubmissions.length} className="rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                      Export JSON
                    </button>
                    <button type="button" onClick={() => handleExport("pdf")} disabled={!filteredSubmissions.length} className="rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                      Export PDF
                    </button>
                    <button type="button" onClick={() => handleExport("excel")} disabled={!filteredSubmissions.length} className="rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                      Export Excel
                    </button>
                  </div>
                </div>
                <div className="mt-5 rounded-[28px] border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Filter responses</div>
                      <p className="text-xs" style={{ color: palette.mutedTextColor }}>
                        Showing {filteredSubmissions.length} of {submissions.length} response{submissions.length === 1 ? "" : "s"}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetResponseFilters}
                      className="rounded-2xl border px-4 py-2 text-sm font-semibold"
                      style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}
                    >
                      Reset filters
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Search all columns
                      <input
                        value={responseFilters.search}
                        onChange={(event) => updateResponseFilter("search", event.target.value)}
                        placeholder="Search name, email, phone..."
                        className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                        style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                      />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Consent
                      <select value={responseFilters.consent} onChange={(event) => updateResponseFilter("consent", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                        <option value="all">All</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Category / reason
                      <select value={responseFilters.category} onChange={(event) => updateResponseFilter("category", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                        <option value="all">All categories and reasons</option>
                        {responseCategoryOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      County
                      <input
                        value={responseFilters.county}
                        onChange={(event) => updateResponseFilter("county", event.target.value)}
                        placeholder="Filter counties"
                        className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                        style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                      />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Coverage
                      <input
                        value={responseFilters.coverage}
                        onChange={(event) => updateResponseFilter("coverage", event.target.value)}
                        placeholder="Sub-county, ward, coverage..."
                        className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                        style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                      />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Sort by
                      <select value={responseFilters.sortBy} onChange={(event) => updateResponseFilter("sortBy", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                        <option value="created_at">Date and time</option>
                        <option value="date">Date only</option>
                        <option value="time">Time submitted</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                      Sort direction
                      <select value={responseFilters.sortDirection} onChange={(event) => updateResponseFilter("sortDirection", event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                        <option value="desc">Newest first</option>
                        <option value="asc">Oldest first</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className="mt-6 overflow-hidden rounded-[28px] border" style={{ borderColor: palette.borderColor }}>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y text-left" style={{ borderColor: palette.borderColor }}>
                      <thead style={{ backgroundColor: palette.surfaceMuted }}>
                        <tr>
                          {["Email", "Consent", "Name", "Phone", "Category / reason", "License details", "County", "Coverage", "Submitted", "Actions"].map((header) => (
                            <th key={header} className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.mutedTextColor }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody style={{ backgroundColor: palette.surfaceBackground }}>
                        {loading ? (
                          <tr><td className="px-4 py-8 text-sm" colSpan={10} style={{ color: palette.mutedTextColor }}>Loading submissions...</td></tr>
                        ) : filteredSubmissions.length > 0 ? (
                          filteredSubmissions.map((submission) => {
                            const coverageText = formatSubmissionCoverage(submission);
                            const countyText = formatSubmissionCounties(submission);
                            const licenseText = formatSubmissionLicenses(submission);

                            return (
                              <tr key={submission.id} className="align-top" style={{ borderTop: `1px solid ${palette.borderColor}` }}>
                                <td className="px-4 py-4 text-sm">{renderLimitedCell(submission.id, "email", submission.email)}</td>
                                <td className="px-4 py-4 text-sm">{renderLimitedCell(submission.id, "consent", submission.consent ? "Yes" : "No")}</td>
                                <td className="px-4 py-4 text-sm">{renderLimitedCell(submission.id, "name", submission.full_name || "-")}</td>
                                <td className="px-4 py-4 text-sm">{renderLimitedCell(submission.id, "phone", submission.phone_number || "-")}</td>
                                <td className="px-4 py-4 text-sm">{renderLimitedCell(submission.id, "category", submission.category || submission.decline_reason || "-")}</td>
                                <td className="px-4 py-4 text-sm">{renderLimitedCell(submission.id, "licenses", licenseText)}</td>
                                <td className="px-4 py-4 text-sm">{renderLimitedCell(submission.id, "counties", countyText)}</td>
                                <td className="px-4 py-4 text-sm">
                                  {renderLimitedCell(submission.id, "coverage", coverageText)}
                                </td>
                                <td className="px-4 py-4 text-sm">{renderLimitedCell(submission.id, "submitted", new Date(submission.created_at).toLocaleString())}</td>
                                <td className="px-4 py-4 text-sm">
                                  <div className="flex flex-col gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleCopySubmission(submission)}
                                      className="rounded-xl border px-3 py-2 text-sm font-semibold"
                                      style={{ borderColor: palette.borderColor, color: palette.textColor }}
                                    >
                                      Copy row
                                    </button>
                                    {confirmingDelete === submission.id ? (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium" style={{ color: "#dc2626" }}>Delete this?</span>
                                        <div className="flex gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSubmission(submission.id)}
                                            className="rounded-lg px-2 py-1 text-xs font-semibold text-white"
                                            style={{ backgroundColor: "#dc2626" }}
                                          >
                                            Yes
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmingDelete(null)}
                                            className="rounded-lg border px-2 py-1 text-xs font-semibold"
                                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                                          >
                                            No
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmingDelete(submission.id)}
                                        className="rounded-xl border px-3 py-2 text-xs font-semibold"
                                        style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr><td className="px-4 py-8 text-sm" colSpan={10} style={{ color: palette.mutedTextColor }}>{submissions.length ? "No responses match the current filters." : "No submissions yet or the database is currently unavailable."}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "solar-mkononi" ? (
              <section className={cardClass} style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold" style={{ color: palette.textColor }}>Solar Mkononi Settings</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: palette.mutedTextColor }}>
                      Manage the standalone Solar Mkononi landing page with separate branding and content.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleResetSolarMkononiSettings}
                      disabled={savingSolarMkononi}
                      className="rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ borderColor: palette.borderColor, color: palette.textColor }}
                    >
                      Reset to defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSolarMkononiSettings}
                      disabled={savingSolarMkononi}
                      className="rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ backgroundColor: palette.primary }}
                    >
                      {savingSolarMkononi ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>

                {!solarMkononiEditor ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 mx-auto" />
                      <p className="text-sm" style={{ color: palette.mutedTextColor }}>Loading Solar Mkononi settings...</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
                      {[
                        { id: "hero", label: "Hero" },
                        { id: "stats", label: "Statistics" },
                        { id: "services", label: "Services" },
                        { id: "howItWorks", label: "How It Works" },
                        { id: "ussd", label: "USSD" },
                        { id: "paygo", label: "PAYGO" },
                        { id: "impact", label: "Impact" },
                        { id: "contact", label: "Contact" },
                        { id: "footer", label: "Footer" },
                        { id: "theme", label: "Theme" },
                        { id: "branding", label: "Branding" }
                      ].map((subTab) => (
                        <button
                          key={subTab.id}
                          onClick={() => setSolarMkononiSubTab(subTab.id)}
                          className="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition"
                          style={{
                            backgroundColor: solarMkononiSubTab === subTab.id ? palette.primary : palette.surfaceMuted,
                            color: solarMkononiSubTab === subTab.id ? "#ffffff" : palette.textColor
                          }}
                        >
                          {subTab.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("hero")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "hero" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "hero" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "hero" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "hero" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Hero
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("stats")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "stats" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "stats" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "stats" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "stats" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Statistics
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("services")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "services" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "services" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "services" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "services" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Services
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("branding")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "branding" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "branding" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "branding" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "branding" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Branding
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("howItWorks")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "howItWorks" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "howItWorks" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "howItWorks" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "howItWorks" ? "#ffffff" : palette.textColor
                        }}
                      >
                        How It Works
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("ussd")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "ussd" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "ussd" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "ussd" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "ussd" ? "#ffffff" : palette.textColor
                        }}
                      >
                        USSD
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("paygo")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "paygo" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "paygo" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "paygo" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "paygo" ? "#ffffff" : palette.textColor
                        }}
                      >
                        PAYGO
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("impact")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "impact" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "impact" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "impact" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "impact" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Impact
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("contact")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "contact" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "contact" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "contact" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "contact" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Contact
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("theme")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "theme" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "theme" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "theme" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "theme" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Theme
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("resourceLibrary")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "resourceLibrary" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "resourceLibrary" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "resourceLibrary" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "resourceLibrary" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Resources
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("partners")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "partners" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "partners" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "partners" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "partners" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Partners
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("footer")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "footer" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "footer" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "footer" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "footer" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Footer
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("registration")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "registration" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "registration" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "registration" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "registration" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Registration
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolarMkononiSubTab("sections")}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${solarMkononiSubTab === "sections" ? "scale-105" : ""}`}
                        style={{
                          borderColor: solarMkononiSubTab === "sections" ? palette.primaryColor : palette.borderColor,
                          backgroundColor: solarMkononiSubTab === "sections" ? palette.primaryColor : palette.surfaceBackground,
                          color: solarMkononiSubTab === "sections" ? "#ffffff" : palette.textColor
                        }}
                      >
                        Sections
                      </button>
                    </div>
                    <div className="space-y-6">
                      {solarMkononiSubTab === "hero" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Hero Section</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the main hero section content.</p>
                          </div>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Headline
                          <input
                            type="text"
                            value={solarMkononiEditor.hero?.headline || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, headline: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Description
                          <textarea
                            rows={3}
                            value={solarMkononiEditor.hero?.description || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, description: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Primary CTA Text
                          <input
                            type="text"
                            value={solarMkononiEditor.hero?.primaryCta || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, primaryCta: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Primary CTA Link
                          <input
                            type="text"
                            value={solarMkononiEditor.hero?.primaryCtaHref || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, primaryCtaHref: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Secondary CTA Text
                          <input
                            type="text"
                            value={solarMkononiEditor.hero?.secondaryCta || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, secondaryCta: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Secondary CTA Link
                          <input
                            type="text"
                            value={solarMkononiEditor.hero?.secondaryCtaHref || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, secondaryCtaHref: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Desktop Background Image URL
                          <input
                            type="text"
                            value={solarMkononiEditor.hero?.backgroundUrl || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, backgroundUrl: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            placeholder="https://..."
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Upload Desktop Background Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const result = await uploadAdminMedia(token, file);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, backgroundUrl: result.url } });
                                  setNotice("Desktop background image uploaded successfully.");
                                } catch (error) {
                                  setError(error.message || "Unable to upload background image.");
                                }
                              }
                            }}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Background Image URL
                          <input
                            type="text"
                            value={solarMkononiEditor.hero?.backgroundUrlMobile || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, backgroundUrlMobile: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            placeholder="https://..."
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Upload Mobile Background Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const result = await uploadAdminMedia(token, file);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, backgroundUrlMobile: result.url } });
                                  setNotice("Mobile background image uploaded successfully.");
                                } catch (error) {
                                  setError(error.message || "Unable to upload background image.");
                                }
                              }
                            }}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Overlay Opacity ({Math.round((solarMkononiEditor.hero?.overlayOpacity || 0.5) * 100)}%)
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={solarMkononiEditor.hero?.overlayOpacity || 0.5}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, overlayOpacity: parseFloat(e.target.value) } })}
                            className="mt-2 w-full"
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable hero section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.hero?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Use desktop background on mobile if no mobile background is set
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.hero?.useDesktopOnMobile !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, hero: { ...solarMkononiEditor.hero, useDesktopOnMobile: e.target.checked } })}
                          />
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "stats" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Statistics</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the statistics counters.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable statistics section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.stats?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, stats: { ...solarMkononiEditor.stats, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Gradient Start Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.stats?.gradientColor || "#059669"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, stats: { ...solarMkononiEditor.stats, gradientColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.stats?.gradientColor || "#059669"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, stats: { ...solarMkononiEditor.stats, gradientColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Gradient End Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.stats?.gradientEnd || "#86efac"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, stats: { ...solarMkononiEditor.stats, gradientEnd: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.stats?.gradientEnd || "#86efac"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, stats: { ...solarMkononiEditor.stats, gradientEnd: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <div className="space-y-3">
                          {solarMkononiEditor.stats?.items?.map((item, index) => (
                            <div key={index} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-2" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Label
                                <input
                                  type="text"
                                  value={item.label || ""}
                                  onChange={(e) => {
                                    const newItems = [...solarMkononiEditor.stats.items];
                                    newItems[index] = { ...newItems[index], label: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, stats: { ...solarMkononiEditor.stats, items: newItems } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Value
                                <input
                                  type="text"
                                  value={item.value || ""}
                                  onChange={(e) => {
                                    const newItems = [...solarMkononiEditor.stats.items];
                                    newItems[index] = { ...newItems[index], value: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, stats: { ...solarMkononiEditor.stats, items: newItems } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = solarMkononiEditor.stats.items.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, stats: { ...solarMkononiEditor.stats, items: newItems } });
                                }}
                                className="md:col-span-2 rounded-xl border px-3 py-2 text-sm font-semibold"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [...(solarMkononiEditor.stats.items || []), { label: "", value: "" }];
                              setSolarMkononiEditor({ ...solarMkononiEditor, stats: { ...solarMkononiEditor.stats, items: newItems } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Statistic
                          </button>
                        </div>
                      </div>
                      )}

                      {solarMkononiSubTab === "services" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Services</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the services cards.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable services section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.services?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.services?.animationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, animationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Style
                          <select
                            value={solarMkononiEditor.services?.animationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, animationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.services?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable mobile load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.services?.mobileAnimationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, mobileAnimationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Style
                          <select
                            value={solarMkononiEditor.services?.mobileAnimationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, mobileAnimationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.services?.mobileAnimationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, mobileAnimationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Carousel Delay (seconds)
                          <input
                            type="number"
                            value={solarMkononiEditor.services?.mobileCarouselDelay || 5}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, mobileCarouselDelay: parseInt(e.target.value) || 5 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="1"
                            max="60"
                          />
                        </label>
                        <div className="space-y-3">
                          {solarMkononiEditor.services?.cards?.map((card, index) => (
                            <div key={index} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Title
                                <input
                                  type="text"
                                  value={card.title || ""}
                                  onChange={(e) => {
                                    const newCards = [...solarMkononiEditor.services.cards];
                                    newCards[index] = { ...newCards[index], title: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, cards: newCards } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Description
                                <textarea
                                  rows={2}
                                  value={card.description || ""}
                                  onChange={(e) => {
                                    const newCards = [...solarMkononiEditor.services.cards];
                                    newCards[index] = { ...newCards[index], description: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, cards: newCards } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCards = solarMkononiEditor.services.cards.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, cards: newCards } });
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm font-semibold"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove Service
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newCards = [...(solarMkononiEditor.services.cards || []), { title: "", description: "" }];
                              setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, cards: newCards } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Service
                          </button>
                        </div>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.services?.backgroundColor || "#f0fdf4"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.services?.backgroundColor || "#f0fdf4"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.services?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, services: { ...solarMkononiEditor.services, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "branding" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Branding</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure Solar Mkononi branding.</p>
                          </div>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Logo URL
                          <input
                            type="text"
                            value={solarMkononiEditor.branding?.logoUrl || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, branding: { ...solarMkononiEditor.branding, logoUrl: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            placeholder="https://..."
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const result = await uploadAdminMedia(token, file);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, branding: { ...solarMkononiEditor.branding, logoUrl: result.url } });
                                  setNotice("Logo uploaded successfully.");
                                } catch (error) {
                                  setError(error.message || "Unable to upload logo.");
                                }
                              }
                            }}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Logo Alt Text
                          <input
                            type="text"
                            value={solarMkononiEditor.branding?.logoAlt || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, branding: { ...solarMkononiEditor.branding, logoAlt: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Favicon URL
                          <input
                            type="text"
                            value={solarMkononiEditor.branding?.faviconUrl || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, branding: { ...solarMkononiEditor.branding, faviconUrl: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            placeholder="https://..."
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Upload Favicon
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const result = await uploadAdminMedia(token, file);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, branding: { ...solarMkononiEditor.branding, faviconUrl: result.url } });
                                  setNotice("Favicon uploaded successfully.");
                                } catch (error) {
                                  setError(error.message || "Unable to upload favicon.");
                                }
                              }
                            }}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "howItWorks" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>How It Works</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the how it works steps.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable how it works section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.howItWorks?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.howItWorks?.animationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, animationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Style
                          <select
                            value={solarMkononiEditor.howItWorks?.animationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, animationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.howItWorks?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <div className="space-y-3">
                          {solarMkononiEditor.howItWorks?.steps?.map((step, index) => (
                            <div key={index} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Title
                                <input
                                  type="text"
                                  value={step.title || ""}
                                  onChange={(e) => {
                                    const newSteps = [...solarMkononiEditor.howItWorks.steps];
                                    newSteps[index] = { ...newSteps[index], title: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, steps: newSteps } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Description
                                <textarea
                                  rows={2}
                                  value={step.description || ""}
                                  onChange={(e) => {
                                    const newSteps = [...solarMkononiEditor.howItWorks.steps];
                                    newSteps[index] = { ...newSteps[index], description: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, steps: newSteps } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newSteps = solarMkononiEditor.howItWorks.steps.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, steps: newSteps } });
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm font-semibold"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove Step
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newSteps = [...(solarMkononiEditor.howItWorks.steps || []), { title: "", description: "" }];
                              setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, steps: newSteps } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Step
                          </button>
                        </div>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.howItWorks?.backgroundColor || "#ffffff"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.howItWorks?.backgroundColor || "#ffffff"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.howItWorks?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, howItWorks: { ...solarMkononiEditor.howItWorks, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "ussd" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>USSD Section</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the USSD section.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable USSD section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.ussd?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.ussd?.animationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, animationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Style
                          <select
                            value={solarMkononiEditor.ussd?.animationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, animationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.ussd?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable mobile load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.ussd?.mobileAnimationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, mobileAnimationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Style
                          <select
                            value={solarMkononiEditor.ussd?.mobileAnimationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, mobileAnimationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.ussd?.mobileAnimationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, mobileAnimationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.ussd?.backgroundColor || "#059669"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.ussd?.backgroundColor || "#059669"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.ussd?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                        <div className="space-y-3">
                          {solarMkononiEditor.ussd?.instructions?.map((instruction, index) => (
                            <div key={index} className="rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Instruction {index + 1}
                                <input
                                  type="text"
                                  value={instruction || ""}
                                  onChange={(e) => {
                                    const newInstructions = [...solarMkononiEditor.ussd.instructions];
                                    newInstructions[index] = e.target.value;
                                    setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, instructions: newInstructions } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newInstructions = solarMkononiEditor.ussd.instructions.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, instructions: newInstructions } });
                                }}
                                className="mt-3 w-full rounded-xl border px-3 py-2 text-sm font-semibold"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newInstructions = [...(solarMkononiEditor.ussd.instructions || []), ""];
                              setSolarMkononiEditor({ ...solarMkononiEditor, ussd: { ...solarMkononiEditor.ussd, instructions: newInstructions } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Instruction
                          </button>
                        </div>
                      </div>
                      )}

                      {solarMkononiSubTab === "paygo" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>PAYGO Solutions</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the PAYGO items.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable PAYGO section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.paygo?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.paygo?.animationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, animationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Style
                          <select
                            value={solarMkononiEditor.paygo?.animationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, animationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.paygo?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable mobile load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.paygo?.mobileAnimationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, mobileAnimationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Style
                          <select
                            value={solarMkononiEditor.paygo?.mobileAnimationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, mobileAnimationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.paygo?.mobileAnimationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, mobileAnimationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <div className="space-y-3">
                          {solarMkononiEditor.paygo?.items?.map((item, index) => (
                            <div key={index} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Title
                                <input
                                  type="text"
                                  value={item.title || ""}
                                  onChange={(e) => {
                                    const newItems = [...solarMkononiEditor.paygo.items];
                                    newItems[index] = { ...newItems[index], title: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, items: newItems } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Description
                                <textarea
                                  rows={2}
                                  value={item.description || ""}
                                  onChange={(e) => {
                                    const newItems = [...solarMkononiEditor.paygo.items];
                                    newItems[index] = { ...newItems[index], description: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, items: newItems } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = solarMkononiEditor.paygo.items.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, items: newItems } });
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm font-semibold"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove Item
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [...(solarMkononiEditor.paygo.items || []), { title: "", description: "" }];
                              setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, items: newItems } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Item
                          </button>
                        </div>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.paygo?.backgroundColor || "#f0fdf4"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.paygo?.backgroundColor || "#f0fdf4"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.paygo?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, paygo: { ...solarMkononiEditor.paygo, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "impact" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Impact Section</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the impact stories.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable impact section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.impact?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.impact?.animationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, animationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Style
                          <select
                            value={solarMkononiEditor.impact?.animationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, animationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.impact?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable mobile load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.impact?.mobileAnimationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, mobileAnimationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Style
                          <select
                            value={solarMkononiEditor.impact?.mobileAnimationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, mobileAnimationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.impact?.mobileAnimationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, mobileAnimationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <div className="space-y-3">
                          {solarMkononiEditor.impact?.stories?.map((story, index) => (
                            <div key={index} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Title
                                <input
                                  type="text"
                                  value={story.title || ""}
                                  onChange={(e) => {
                                    const newStories = [...solarMkononiEditor.impact.stories];
                                    newStories[index] = { ...newStories[index], title: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, stories: newStories } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Description
                                <textarea
                                  rows={2}
                                  value={story.description || ""}
                                  onChange={(e) => {
                                    const newStories = [...solarMkononiEditor.impact.stories];
                                    newStories[index] = { ...newStories[index], description: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, stories: newStories } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Image URL
                                <input
                                  type="text"
                                  value={story.imageUrl || ""}
                                  onChange={(e) => {
                                    const newStories = [...solarMkononiEditor.impact.stories];
                                    newStories[index] = { ...newStories[index], imageUrl: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, stories: newStories } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newStories = solarMkononiEditor.impact.stories.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, stories: newStories } });
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm font-semibold"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove Story
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newStories = [...(solarMkononiEditor.impact.stories || []), { title: "", description: "", imageUrl: "" }];
                              setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, stories: newStories } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Story
                          </button>
                        </div>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.impact?.backgroundColor || "#ffffff"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.impact?.backgroundColor || "#ffffff"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.impact?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, impact: { ...solarMkononiEditor.impact, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "contact" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Contact Section</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure contact information.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable contact section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.contact?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.contact?.animationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, animationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Style
                          <select
                            value={solarMkononiEditor.contact?.animationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, animationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.contact?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable mobile load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.contact?.mobileAnimationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, mobileAnimationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Style
                          <select
                            value={solarMkononiEditor.contact?.mobileAnimationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, mobileAnimationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.contact?.mobileAnimationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, mobileAnimationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable phone ring/shake animation
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.contact?.phoneRingEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, phoneRingEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Form Recipient Email
                          <input
                            type="email"
                            value={solarMkononiEditor.contact?.recipientEmail || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, recipientEmail: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            placeholder="email@example.com"
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Contact Email
                          <input
                            type="email"
                            value={solarMkononiEditor.contact?.email || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, email: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            placeholder="contact@example.com"
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Contact Phone
                          <input
                            type="tel"
                            value={solarMkononiEditor.contact?.phone || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, phone: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            placeholder="+254 700 000 000"
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Contact Address
                          <textarea
                            rows={2}
                            value={solarMkononiEditor.contact?.address || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, address: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            placeholder="123 Main Street, Nairobi, Kenya"
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable contact form
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.contact?.formEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, formEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.contact?.backgroundColor || "#f0fdf4"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.contact?.backgroundColor || "#f0fdf4"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.contact?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, contact: { ...solarMkononiEditor.contact, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "theme" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Theme Colors</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure Solar Mkononi theme colors.</p>
                          </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                            Primary Color
                            <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <input
                                type="color"
                                value={solarMkononiEditor.theme?.primaryColor || "#059669"}
                                onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, primaryColor: e.target.value } })}
                                className="h-8 w-12 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={solarMkononiEditor.theme?.primaryColor || "#059669"}
                                onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, primaryColor: e.target.value } })}
                                className="flex-1 bg-transparent outline-none"
                              />
                            </div>
                          </label>
                          <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                            Secondary Color
                            <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <input
                                type="color"
                                value={solarMkononiEditor.theme?.secondaryColor || "#10b981"}
                                onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, secondaryColor: e.target.value } })}
                                className="h-8 w-12 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={solarMkononiEditor.theme?.secondaryColor || "#10b981"}
                                onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, secondaryColor: e.target.value } })}
                                className="flex-1 bg-transparent outline-none"
                              />
                            </div>
                          </label>
                          <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                            Background Color
                            <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <input
                                type="color"
                                value={solarMkononiEditor.theme?.backgroundColor || "#f0fdf4"}
                                onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, backgroundColor: e.target.value } })}
                                className="h-8 w-12 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={solarMkononiEditor.theme?.backgroundColor || "#f0fdf4"}
                                onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, backgroundColor: e.target.value } })}
                                className="flex-1 bg-transparent outline-none"
                              />
                            </div>
                          </label>
                          <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                            Text Color
                            <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <input
                                type="color"
                                value={solarMkononiEditor.theme?.textColor || "#064e3b"}
                                onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, textColor: e.target.value } })}
                                className="h-8 w-12 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={solarMkononiEditor.theme?.textColor || "#064e3b"}
                                onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, textColor: e.target.value } })}
                                className="flex-1 bg-transparent outline-none"
                              />
                            </div>
                          </label>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                            Navbar transparency ({Math.round((solarMkononiEditor.theme?.navOpacity ?? 0.85) * 100)}%)
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              className="mt-3 w-full"
                              value={solarMkononiEditor.theme?.navOpacity ?? 0.85}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, navOpacity: Number(e.target.value) } })}
                            />
                          </label>
                          <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                            Mobile menu slide direction
                            <select
                              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm"
                              style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                              value={solarMkononiEditor.theme?.navSlideDirection || "left"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, navSlideDirection: e.target.value } })}
                            >
                              <option value="left">Slide from left</option>
                              <option value="right">Slide from right</option>
                            </select>
                          </label>
                          <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                            Solar Mkononi page scale ({Math.round((solarMkononiEditor.theme?.desktopHomepageSize ?? 0.9) * 100)}%)
                            <span className="block text-xs font-normal" style={{ color: palette.mutedTextColor }}>Only affects the Solar Mkononi homepage, not the rest of the site.</span>
                            <input
                              type="range"
                              min="0.5"
                              max="1.5"
                              step="0.05"
                              className="mt-3 w-full"
                              value={solarMkononiEditor.theme?.desktopHomepageSize ?? 0.9}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, theme: { ...solarMkononiEditor.theme, desktopHomepageSize: Number(e.target.value) } })}
                            />
                          </label>
                        </div>
                      </div>
                      )}

                      {solarMkononiSubTab === "resourceLibrary" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Resource Library</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the resource library.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable resource library section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.resourceLibrary?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.resourceLibrary?.animationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, animationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Style
                          <select
                            value={solarMkononiEditor.resourceLibrary?.animationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, animationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.resourceLibrary?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable mobile load-in animations
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.resourceLibrary?.mobileAnimationEnabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, mobileAnimationEnabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Style
                          <select
                            value={solarMkononiEditor.resourceLibrary?.mobileAnimationStyle || "fade-up"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, mobileAnimationStyle: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="fade-up">Fade Up</option>
                            <option value="fade-down">Fade Down</option>
                            <option value="fade-left">Fade Left</option>
                            <option value="fade-right">Fade Right</option>
                            <option value="scale-up">Scale Up</option>
                            <option value="scale-down">Scale Down</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="rotate">Rotate</option>
                            <option value="none">None (appear)</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Mobile Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.resourceLibrary?.mobileAnimationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, mobileAnimationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.resourceLibrary?.backgroundColor || "#eff6ff"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.resourceLibrary?.backgroundColor || "#eff6ff"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <div className="space-y-3">
                          {solarMkononiEditor.resourceLibrary?.resources?.map((resource, index) => (
                            <div key={index} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Title
                                <input
                                  type="text"
                                  value={resource.title || ""}
                                  onChange={(e) => {
                                    const newResources = [...solarMkononiEditor.resourceLibrary.resources];
                                    newResources[index] = { ...newResources[index], title: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, resources: newResources } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Description
                                <textarea
                                  rows={2}
                                  value={resource.description || ""}
                                  onChange={(e) => {
                                    const newResources = [...solarMkononiEditor.resourceLibrary.resources];
                                    newResources[index] = { ...newResources[index], description: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, resources: newResources } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                URL
                                <input
                                  type="text"
                                  value={resource.url || ""}
                                  onChange={(e) => {
                                    const newResources = [...solarMkononiEditor.resourceLibrary.resources];
                                    newResources[index] = { ...newResources[index], url: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, resources: newResources } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                  placeholder="https://..."
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newResources = solarMkononiEditor.resourceLibrary.resources.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, resources: newResources } });
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm font-semibold"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove Resource
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newResources = [...(solarMkononiEditor.resourceLibrary.resources || []), { title: "", description: "", url: "" }];
                              setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, resources: newResources } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Resource
                          </button>
                        </div>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.resourceLibrary?.backgroundColor || "#f0fdf4"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.resourceLibrary?.backgroundColor || "#f0fdf4"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.resourceLibrary?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, resourceLibrary: { ...solarMkononiEditor.resourceLibrary, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "partners" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Partners</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure partner logos.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable partners section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.partners?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, partners: { ...solarMkononiEditor.partners, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.partners?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, partners: { ...solarMkononiEditor.partners, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <div className="space-y-3">
                          {solarMkononiEditor.partners?.logos?.map((logo, index) => (
                            <div key={index} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Logo URL
                                <input
                                  type="text"
                                  value={logo.url || ""}
                                  onChange={(e) => {
                                    const newLogos = [...solarMkononiEditor.partners.logos];
                                    newLogos[index] = { ...newLogos[index], url: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, partners: { ...solarMkononiEditor.partners, logos: newLogos } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Upload logo file
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePartnerLogoUpload(index, e)}
                                  className="mt-2 block w-full text-sm"
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Alt Text
                                <input
                                  type="text"
                                  value={logo.alt || ""}
                                  onChange={(e) => {
                                    const newLogos = [...solarMkononiEditor.partners.logos];
                                    newLogos[index] = { ...newLogos[index], alt: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, partners: { ...solarMkononiEditor.partners, logos: newLogos } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newLogos = solarMkononiEditor.partners.logos.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, partners: { ...solarMkononiEditor.partners, logos: newLogos } });
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm font-semibold"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove Logo
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newLogos = [...(solarMkononiEditor.partners.logos || []), { url: "", alt: "" }];
                              setSolarMkononiEditor({ ...solarMkononiEditor, partners: { ...solarMkononiEditor.partners, logos: newLogos } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Logo
                          </button>
                        </div>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.partners?.backgroundColor || "#ffffff"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, partners: { ...solarMkononiEditor.partners, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.partners?.backgroundColor || "#ffffff"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, partners: { ...solarMkononiEditor.partners, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.partners?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, partners: { ...solarMkononiEditor.partners, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "footer" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Footer</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the footer.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable footer section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.footer?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.footer?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Title
                          <input
                            type="text"
                            value={solarMkononiEditor.footer?.title || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, title: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Body
                          <textarea
                            rows={2}
                            value={solarMkononiEditor.footer?.body || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, body: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Copyright
                          <input
                            type="text"
                            value={solarMkononiEditor.footer?.copyright || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, copyright: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <div className="space-y-3">
                          <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Links</div>
                          {solarMkononiEditor.footer?.links?.map((link, index) => (
                            <div key={index} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-2" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Label
                                <input
                                  type="text"
                                  value={link.label || ""}
                                  onChange={(e) => {
                                    const newLinks = [...solarMkononiEditor.footer.links];
                                    newLinks[index] = { ...newLinks[index], label: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, links: newLinks } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                URL
                                <input
                                  type="text"
                                  value={link.href || ""}
                                  onChange={(e) => {
                                    const newLinks = [...solarMkononiEditor.footer.links];
                                    newLinks[index] = { ...newLinks[index], href: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, links: newLinks } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = solarMkononiEditor.footer.links.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, links: newLinks } });
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm font-semibold md:col-span-2"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove Link
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newLinks = [...(solarMkononiEditor.footer.links || []), { label: "", href: "" }];
                              setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, links: newLinks } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Link
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Social Links</div>
                          {solarMkononiEditor.footer?.socialLinks?.map((social, index) => (
                            <div key={index} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-2" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                Icon (emoji)
                                <input
                                  type="text"
                                  value={social.icon || ""}
                                  onChange={(e) => {
                                    const newSocialLinks = [...solarMkononiEditor.footer.socialLinks];
                                    newSocialLinks[index] = { ...newSocialLinks[index], icon: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, socialLinks: newSocialLinks } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                                URL
                                <input
                                  type="text"
                                  value={social.url || ""}
                                  onChange={(e) => {
                                    const newSocialLinks = [...solarMkononiEditor.footer.socialLinks];
                                    newSocialLinks[index] = { ...newSocialLinks[index], url: e.target.value };
                                    setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, socialLinks: newSocialLinks } });
                                  }}
                                  className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                                  style={{ borderColor: palette.borderColor }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const newSocialLinks = solarMkononiEditor.footer.socialLinks.filter((_, i) => i !== index);
                                  setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, socialLinks: newSocialLinks } });
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm font-semibold md:col-span-2"
                                style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                              >
                                Remove Social Link
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newSocialLinks = [...(solarMkononiEditor.footer.socialLinks || []), { icon: "", url: "" }];
                              setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, socialLinks: newSocialLinks } });
                            }}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            + Add Social Link
                          </button>
                        </div>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.footer?.backgroundColor || "#064e3b"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.footer?.backgroundColor || "#064e3b"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.footer?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, footer: { ...solarMkononiEditor.footer, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "registration" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Registration Section</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Configure the registration section.</p>
                          </div>
                        <label className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                          Enable registration section
                          <input
                            type="checkbox"
                            checked={solarMkononiEditor.registration?.enabled !== false}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, registration: { ...solarMkononiEditor.registration, enabled: e.target.checked } })}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Animation Delay (ms)
                          <input
                            type="number"
                            value={solarMkononiEditor.registration?.animationDelay || 100}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, registration: { ...solarMkononiEditor.registration, animationDelay: parseInt(e.target.value) || 100 } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                            min="0"
                            step="50"
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Title
                          <input
                            type="text"
                            value={solarMkononiEditor.registration?.title || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, registration: { ...solarMkononiEditor.registration, title: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Description
                          <textarea
                            rows={2}
                            value={solarMkononiEditor.registration?.description || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, registration: { ...solarMkononiEditor.registration, description: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Button Text
                          <input
                            type="text"
                            value={solarMkononiEditor.registration?.buttonText || ""}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, registration: { ...solarMkononiEditor.registration, buttonText: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Registration Link
                          <input
                            type="text"
                            value={solarMkononiEditor.registration?.link || "https://ussd.kerea.org"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, registration: { ...solarMkononiEditor.registration, link: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          />
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Color
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
                            <input
                              type="color"
                              value={solarMkononiEditor.registration?.backgroundColor || "#059669"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, registration: { ...solarMkononiEditor.registration, backgroundColor: e.target.value } })}
                              className="h-8 w-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={solarMkononiEditor.registration?.backgroundColor || "#059669"}
                              onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, registration: { ...solarMkononiEditor.registration, backgroundColor: e.target.value } })}
                              className="flex-1 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm font-medium" style={{ color: palette.textColor }}>
                          Background Pattern
                          <select
                            value={solarMkononiEditor.registration?.backgroundPattern || "none"}
                            onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, registration: { ...solarMkononiEditor.registration, backgroundPattern: e.target.value } })}
                            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
                            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}
                          >
                            <option value="none">None</option>
                            <option value="wave">Wave</option>
                            <option value="web">Web</option>
                            <option value="dots">Dots</option>
                            <option value="grid">Grid</option>
                            <option value="zigzag">Zigzag</option>
                          </select>
                        </label>
                      </div>
                      )}

                      {solarMkononiSubTab === "sections" && (
                        <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: palette.textColor }}>Section Visibility</div>
                            <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>Enable or disable page sections.</p>
                          </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {Object.entries(solarMkononiEditor.sections || {}).map(([key, value]) => (
                            <label key={key} className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.borderColor, color: palette.textColor, backgroundColor: palette.surfaceBackground }}>
                              <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                              <input
                                type="checkbox"
                                checked={value !== false}
                                onChange={(e) => setSolarMkononiEditor({ ...solarMkononiEditor, sections: { ...solarMkononiEditor.sections, [key]: e.target.checked } })}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                        <div className="text-sm font-semibold mb-4" style={{ color: palette.textColor }}>Quick Actions</div>
                        <div className="space-y-3">
                          <a
                            href="/solar-mkononi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition hover:scale-105"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            View Solar Mkononi Page
                          </a>
                          <button
                            type="button"
                            onClick={() => setSolarMkononiEditor(solarMkononiSettings)}
                            className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:scale-105"
                            style={{ borderColor: palette.borderColor, color: palette.textColor }}
                          >
                            Discard Unsaved Changes
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[28px] border p-5" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                        <div className="text-sm font-semibold mb-4" style={{ color: palette.textColor }}>Page Info</div>
                        <div className="space-y-2 text-sm" style={{ color: palette.mutedTextColor }}>
                          <div>
                            <span className="font-semibold" style={{ color: palette.textColor }}>URL:</span> /solar-mkononi
                          </div>
                          <div>
                            <span className="font-semibold" style={{ color: palette.textColor }}>Status:</span> Standalone page
                          </div>
                          <div>
                            <span className="font-semibold" style={{ color: palette.textColor }}>Navigation:</span> Not in main menu
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminConsolePage;
