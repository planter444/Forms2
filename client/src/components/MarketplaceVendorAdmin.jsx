import { useEffect, useMemo, useState } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import {
  deleteMarketplaceSubmission,
  exportMarketplaceSubmissions,
  getMarketplaceSettings,
  getMarketplaceSubmissions,
  updateMarketplaceSettings
} from "../lib/api.js";
import {
  copyMarketplaceSubmission,
  copyMarketplaceSubmissions,
  downloadMarketplaceSubmissionExcel,
  downloadMarketplaceSubmissionJson,
  downloadMarketplaceSubmissionsExcel,
  downloadMarketplaceSubmissionsJson,
  formatMarketplaceCoverage,
  getFileDownloadUrl,
  printMarketplaceSubmissionPdf,
  printMarketplaceSubmissionsPdf
} from "../lib/marketplaceAdmin.js";

const defaultProductCategoryOptions = [
  "Solar Products",
  "Energy Storage Solutions",
  "Clean Cooking Solutions",
  "Biogas Solutions",
  "Solar Water Pumping",
  "Mini-Grid Equipment",
  "E-Mobility Solutions",
  "Productive Use Equipment",
  "Green Hydrogen Solutions",
  "Wind Energy Equipment",
  "Other"
];

const yearsOptions = ["Less than 1 Year", "1 – 3 Years", "4 – 7 Years", "8 – 10 Years", "More than 10 Years"];

const defaultRequired = {
  companyName: true,
  contactPerson: true,
  phoneNumber: true,
  email: true,
  physicalAddress: false,
  website: false,
  companyProfile: true,
  businessRegNumber: true,
  kraPin: true,
  certifications: true,
  yearsOfOperation: true,
  countyCoverage: true,
  productCategories: true,
  brandsRepresented: false,
  socialMediaLinks: false,
  declaration: true
};

const fieldLabels = {
  companyName: "Company Name",
  contactPerson: "Contact Person",
  phoneNumber: "Phone Number",
  email: "Email",
  physicalAddress: "Physical Address",
  website: "Website",
  companyProfile: "Company Profile",
  businessRegNumber: "Business Registration Number",
  kraPin: "KRA PIN",
  certifications: "Certifications",
  yearsOfOperation: "Years of Operation",
  countyCoverage: "County / Coverage",
  productCategories: "Product Categories",
  brandsRepresented: "Brands Represented",
  socialMediaLinks: "Social Media Links",
  declaration: "Declaration"
};

const defaultContent = {
  landing: {
    heroBadge: "KEREA Marketplace",
    heroBadgeLink: "",
    heroTitle: "A simple, secure way for distributors and suppliers to be listed.",
    heroDescription: "Join Kenya's trusted renewable energy marketplace. Showcase your products, coverage, and certifications in minutes.",
    heroPrimaryCta: "Get Listed",
    heroSecondaryCta: "Learn More",
    heroStats: [
      { value: "47", label: "Counties supported" },
      { value: "5 min", label: "Average application time" },
      { value: "100%", label: "Mobile responsive" },
      { value: "24/7", label: "Visibility" }
    ],
    landingHighlights: [
      "Company and contact details",
      "Coverage area and product categories",
      "KRA PIN and certifications"
    ],
    whyItMattersTitle: "Why join?",
    whyItMattersBody: "Listing on KEREA Marketplace connects distributors and suppliers directly with buyers looking for verified renewable energy products across Kenya.",
    howItWorksTitle: "How to get listed",
    howItWorksSteps: [
      { title: "Create your profile", body: "Share company information, contact details, and your business verification documents." },
      { title: "Define coverage", body: "Select counties, sub-counties, and wards, or choose countrywide delivery." },
      { title: "List products", body: "Add product categories, the brands you represent, and your online presence." },
      { title: "Submit for review", body: "Review everything, make edits, and send your application for verification." }
    ]
  },
  form: {
    headingByStep: {
      company: "Company details",
      verification: "Business verification",
      coverage: "Coverage information",
      products: "Products & declaration",
      review: "Review before submitting"
    },
    tips: {
      company: [
        "Provide your registered company name as it appears on official documents.",
        "Use a valid email and phone number that buyers can reach you on.",
        "Briefly describe what your company does and the products you supply."
      ],
      verification: [
        "Enter your business registration number.",
        "Upload your KRA PIN certificate for verification.",
        "Relevant certifications are optional but help build buyer trust."
      ],
      coverage: [
        "Choose countrywide delivery or select the counties you serve.",
        "Add sub-counties and wards if you deliver to specific locations.",
        "Accurate coverage helps buyers find the right supplier."
      ],
      products: [
        "Select the renewable energy product categories you supply.",
        "List the brands your business officially represents.",
        "Social media links are optional but help with credibility."
      ],
      review: [
        "Check all the details before submitting.",
        "Click the edit icon on any section to make changes.",
        "Your progress is saved automatically, so you can resume later."
      ]
    }
  }
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const FloatingField = ({ id, label, value, onChange, type = "text", as = "input", rows = 4, required = false }) => {
  const { palette } = useSiteSettings();
  const classes = `border-2 peer w-full rounded-2xl px-4 pb-3 pt-6 text-sm shadow-sm outline-none transition focus:ring-4 ${
    type === "textarea" ? "resize-none" : ""
  }`;

  return (
    <div className="space-y-2">
      <div className="relative">
        {as === "textarea" ? (
          <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={label}
            rows={rows}
            className={classes}
            style={{
              backgroundColor: palette.fieldBackground || palette.surfaceBackground,
              color: palette.textColor,
              borderColor: "#94a3b8"
            }}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={label}
            className={classes}
            style={{
              backgroundColor: palette.fieldBackground || palette.surfaceBackground,
              color: palette.textColor,
              borderColor: "#94a3b8"
            }}
          />
        )}
        <label htmlFor={id} className="pointer-events-none absolute left-4 right-4 top-2 text-[11px] font-medium transition peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px]" style={{ color: palette.mutedTextColor }}>
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </label>
      </div>
    </div>
  );
};

const RadioField = ({ label, options, value, onChange }) => {
  const { palette } = useSiteSettings();

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium" style={{ color: palette.textColor }}>{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className="rounded-2xl border px-4 py-2 text-sm font-semibold transition"
            style={{
              borderColor: value === option ? palette.primary : palette.borderColor,
              backgroundColor: value === option ? palette.accent : "transparent",
              color: value === option ? palette.primaryDeep : palette.textColor
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

const ReadOnlyField = ({ label, value, children, className = "" }) => {
  const { palette } = useSiteSettings();

  return (
    <div className={className}>
      <div className="text-xs font-medium uppercase tracking-[0.1em]" style={{ color: palette.mutedTextColor }}>{label}</div>
      <div className="mt-1 break-words rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted, color: palette.textColor }}>
        {value || "-"}
      </div>
      {children}
    </div>
  );
};

const initialEditState = {
  companyName: "",
  contactPerson: "",
  phoneNumber: "",
  email: "",
  physicalAddress: "",
  county: "",
  coverageMode: "",
  coverageDetails: "",
  coverageEntries: [],
  website: "",
  companyProfile: "",
  businessRegNumber: "",
  kraPin: { number: "", fileName: "", fileData: "" },
  certifications: [],
  yearsOfOperation: "",
  productCategories: [],
  brandsRepresented: "",
  socialMediaLinks: "",
  declaration: "Yes"
};

const MarketplaceVendorAdmin = ({ token }) => {
  const { palette } = useSiteSettings();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [editValues, setEditValues] = useState({ ...initialEditState });
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [fieldConfig, setFieldConfig] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([...defaultProductCategoryOptions]);
  const [newCategory, setNewCategory] = useState("");
  const [content, setContent] = useState(defaultContent);
  const [contentString, setContentString] = useState(JSON.stringify(defaultContent, null, 2));
  const [contentError, setContentError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await getMarketplaceSubmissions(token);
      setSubmissions(data.submissions || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load marketplace submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load();
      getMarketplaceSettings()
        .then((data) => {
          const loaded = data.fieldConfig || {};
          setFieldConfig(loaded);
          setCategoryOptions(Array.isArray(loaded.categoryOptions) && loaded.categoryOptions.length ? loaded.categoryOptions : [...defaultProductCategoryOptions]);
          const loadedContent = loaded.content ? { ...defaultContent, ...loaded.content } : defaultContent;
          setContent(loadedContent);
          setContentString(JSON.stringify(loadedContent, null, 2));
        })
        .catch(() => setFieldConfig({}));
    }
  }, [token]);

  const filteredSubmissions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const countyNeedle = countyFilter.trim().toLowerCase();
    const categoryNeedle = categoryFilter.toLowerCase();

    return submissions.filter((item) => {
      if (needle) {
        const haystack = `
          ${item.companyName || ""} ${item.contactPerson || ""} ${item.email || ""}
          ${item.phoneNumber || ""} ${item.businessRegNumber || ""} ${item.kraPin || ""}
        `.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      if (countyNeedle) {
        const coverageText = `${item.county || ""} ${item.coverageDetails || ""}`.toLowerCase();
        if (!coverageText.includes(countyNeedle)) {
          return false;
        }
      }

      if (categoryNeedle && !(item.productCategories || []).some((c) => c.toLowerCase().includes(categoryNeedle))) {
        return false;
      }

      return true;
    });
  }, [submissions, search, countyFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const filtered = filteredSubmissions.length;
    const uniqueCounties = new Set();
    let coverageCount = 0;
    let productCategoryCount = 0;

    submissions.forEach((item) => {
      (item.coverageEntries || []).forEach((entry) => {
        if (entry?.county) {
          uniqueCounties.add(entry.county);
        }
        coverageCount += 1;
      });
      productCategoryCount += (item.productCategories || []).length;
    });

    return {
      total,
      filtered,
      uniqueCounties: uniqueCounties.size,
      coverageCount,
      productCategoryCount
    };
  }, [submissions, filteredSubmissions]);

  const handleExport = async () => {
    try {
      const blob = await exportMarketplaceSubmissions(token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `marketplace-vendor-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setNotice("Marketplace submissions exported.");
    } catch (requestError) {
      setError(requestError.message || "Export failed.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMarketplaceSubmission(token, id);
      setSubmissions((current) => current.filter((item) => item.id !== id));
      setConfirmingDelete(null);
      setNotice("Submission deleted.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete submission.");
    }
  };

  const openEdit = (item) => {
    setSelected(item);
    setEditValues({
      companyName: item.companyName || "",
      contactPerson: item.contactPerson || "",
      phoneNumber: item.phoneNumber || "",
      email: item.email || "",
      physicalAddress: item.physicalAddress || "",
      county: item.county || "",
      coverageMode: item.coverageMode || "",
      coverageDetails: item.coverageDetails || "",
      coverageEntries: Array.isArray(item.coverageEntries) ? [...item.coverageEntries] : [],
      website: item.website || "",
      companyProfile: item.companyProfile || "",
      businessRegNumber: item.businessRegNumber || "",
      kraPin: item.kraPin && typeof item.kraPin === "object"
        ? { ...item.kraPin }
        : { number: `${item.kraPin || ""}`, fileName: "", fileData: "" },
      certifications: Array.isArray(item.certifications) ? [...item.certifications] : [],
      yearsOfOperation: item.yearsOfOperation || "",
      productCategories: Array.isArray(item.productCategories) ? [...item.productCategories] : [],
      brandsRepresented: item.brandsRepresented || "",
      socialMediaLinks: item.socialMediaLinks || "",
      declaration: item.declaration || "Yes"
    });
  };

  const closeEdit = () => {
    setSelected(null);
    setEditValues({ ...initialEditState });
  };

  const handleEditChange = (field, value) => {
    setEditValues((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!editValues.companyName.trim() || !editValues.email.trim() || !editValues.phoneNumber.trim()) {
      setError("Company name, email, and phone number are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data = await updateMarketplaceSubmission(token, selected.id, editValues);
      setSubmissions((current) =>
        current.map((item) => (item.id === selected.id ? data.submission : item))
      );
      setNotice("Submission updated.");
      closeEdit();
    } catch (requestError) {
      setError(requestError.message || "Unable to update submission.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async (nextConfig) => {
    setSavingConfig(true);
    setError("");

    try {
      const data = await updateMarketplaceSettings(token, nextConfig);
      setFieldConfig(data.fieldConfig || nextConfig);
      setNotice("Marketplace form settings saved.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save marketplace settings.");
    } finally {
      setSavingConfig(false);
    }
  };

  const isFieldRequired = (field) =>
    fieldConfig.required?.[field] !== undefined
      ? Boolean(fieldConfig.required[field])
      : (fieldConfig[field] !== undefined ? Boolean(fieldConfig[field]) : defaultRequired[field]);

  const isFieldVisible = (field) =>
    fieldConfig.show?.[field] !== false;

  const toggleRequired = (field) => {
    const next = { ...fieldConfig, required: { ...fieldConfig.required, [field]: !isFieldRequired(field) } };
    setFieldConfig(next);
    handleSaveConfig(next);
  };

  const toggleVisible = (field) => {
    const next = { ...fieldConfig, show: { ...fieldConfig.show, [field]: !isFieldVisible(field) } };
    setFieldConfig(next);
    handleSaveConfig(next);
  };

  const toggleUpload = (key) => {
    const next = { ...fieldConfig, [key]: !fieldConfig[key] };
    setFieldConfig(next);
    handleSaveConfig(next);
  };

  const handleSaveContent = async () => {
    let parsed;
    try {
      parsed = JSON.parse(contentString);
    } catch {
      setContentError("Invalid JSON. Please check the content editor.");
      return;
    }

    setContentError("");
    const next = { ...fieldConfig, content: parsed };
    setContent(parsed);
    await handleSaveConfig(next);
  };

  const tableHeadClass = "text-left text-xs font-semibold uppercase tracking-[0.1em]";
  const buttonClass = "rounded-2xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50";

  return (
    <section className="rounded-[28px] border p-5 shadow-sm" style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: palette.textColor }}>Marketplace Vendor Submissions</h2>
          <p className="mt-1 text-sm" style={{ color: palette.mutedTextColor }}>
            Review, edit, export, and manage vendor onboarding applications.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} disabled={loading} className={buttonClass} style={{ borderColor: palette.borderColor, color: palette.textColor }}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button type="button" onClick={handleExport} disabled={!submissions.length} className={buttonClass} style={{ borderColor: palette.borderColor, color: palette.textColor }}>
            Export CSV
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await copyMarketplaceSubmissions(filteredSubmissions);
                setNotice("Filtered responses copied to clipboard.");
              } catch {
                setError("Unable to copy filtered responses.");
              }
            }}
            disabled={!filteredSubmissions.length}
            className={buttonClass}
            style={{ borderColor: palette.borderColor, color: palette.textColor }}
          >
            Copy filtered
          </button>
          <button
            type="button"
            onClick={() => downloadMarketplaceSubmissionsJson(filteredSubmissions)}
            disabled={!filteredSubmissions.length}
            className={buttonClass}
            style={{ borderColor: palette.borderColor, color: palette.textColor }}
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => downloadMarketplaceSubmissionsExcel(filteredSubmissions)}
            disabled={!filteredSubmissions.length}
            className={buttonClass}
            style={{ borderColor: palette.borderColor, color: palette.textColor }}
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => printMarketplaceSubmissionsPdf(filteredSubmissions)}
            disabled={!filteredSubmissions.length}
            className={buttonClass}
            style={{ borderColor: palette.borderColor, color: palette.textColor }}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total submissions", value: stats.total },
          { label: "Filtered", value: stats.filtered },
          { label: "Counties covered", value: stats.uniqueCounties },
          { label: "Coverage entries", value: stats.coverageCount },
          { label: "Product category selections", value: stats.productCategoryCount }
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border p-4"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}
          >
            <div className="text-2xl font-bold" style={{ color: palette.textColor }}>{stat.value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider" style={{ color: palette.mutedTextColor }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {notice ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

      <div className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: palette.surfaceMuted, borderColor: palette.borderColor }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold" style={{ color: palette.textColor }}>Form field settings</h3>
          {savingConfig ? <span className="text-xs" style={{ color: palette.mutedTextColor }}>Saving...</span> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(fieldLabels).map(([field, label]) => (
            <div key={field} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
              <span className="text-sm" style={{ color: palette.textColor }}>{label}</span>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-1 text-xs" style={{ color: palette.mutedTextColor }}>
                  <input
                    type="checkbox"
                    checked={isFieldVisible(field)}
                    onChange={() => toggleVisible(field)}
                    disabled={savingConfig}
                    className="h-3 w-3"
                  />
                  Show
                </label>
                <label className="flex cursor-pointer items-center gap-1 text-xs" style={{ color: palette.mutedTextColor }}>
                  <input
                    type="checkbox"
                    checked={isFieldRequired(field)}
                    onChange={() => toggleRequired(field)}
                    disabled={savingConfig}
                    className="h-3 w-3"
                  />
                  Required
                </label>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs" style={{ color: palette.mutedTextColor }}>
          Checked fields are mandatory for vendors filling the marketplace application.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: palette.surfaceMuted, borderColor: palette.borderColor }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold" style={{ color: palette.textColor }}>Media upload options</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border p-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
            <input type="checkbox" checked={fieldConfig.showBusinessRegUpload !== false} onChange={() => toggleUpload("showBusinessRegUpload")} disabled={savingConfig} className="h-4 w-4" />
            <span className="text-sm" style={{ color: palette.textColor }}>Show business reg upload</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border p-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
            <input type="checkbox" checked={Boolean(fieldConfig.businessRegUploadRequired)} onChange={() => toggleUpload("businessRegUploadRequired")} disabled={savingConfig} className="h-4 w-4" />
            <span className="text-sm" style={{ color: palette.textColor }}>Business reg upload required</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border p-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
            <input type="checkbox" checked={fieldConfig.showKraPinUpload !== false} onChange={() => toggleUpload("showKraPinUpload")} disabled={savingConfig} className="h-4 w-4" />
            <span className="text-sm" style={{ color: palette.textColor }}>Show KRA PIN upload</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border p-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
            <input type="checkbox" checked={Boolean(fieldConfig.kraPinUploadRequired)} onChange={() => toggleUpload("kraPinUploadRequired")} disabled={savingConfig} className="h-4 w-4" />
            <span className="text-sm" style={{ color: palette.textColor }}>KRA PIN upload required</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border p-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
            <input type="checkbox" checked={fieldConfig.showCertificationsUpload !== false} onChange={() => toggleUpload("showCertificationsUpload")} disabled={savingConfig} className="h-4 w-4" />
            <span className="text-sm" style={{ color: palette.textColor }}>Show certification upload</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border p-3" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground }}>
            <input type="checkbox" checked={Boolean(fieldConfig.certificationsUploadRequired)} onChange={() => toggleUpload("certificationsUploadRequired")} disabled={savingConfig} className="h-4 w-4" />
            <span className="text-sm" style={{ color: palette.textColor }}>Certification upload required</span>
          </label>
        </div>
        <p className="mt-3 text-xs" style={{ color: palette.mutedTextColor }}>
          Control whether vendors can see and must upload media for business registration, KRA PIN, and certifications.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: palette.surfaceMuted, borderColor: palette.borderColor }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold" style={{ color: palette.textColor }}>Product categories</h3>
          <button
            type="button"
            onClick={() => handleSaveConfig({ ...fieldConfig, categoryOptions })}
            disabled={savingConfig}
            className="rounded-2xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}
          >
            {savingConfig ? "Saving..." : "Save categories"}
          </button>
        </div>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (newCategory.trim() && !categoryOptions.includes(newCategory.trim())) {
                  setCategoryOptions((current) => [...current, newCategory.trim()]);
                  setNewCategory("");
                }
              }
            }}
            placeholder="Add a new category"
            className="flex-1 rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}
          />
          <button
            type="button"
            onClick={() => {
              if (newCategory.trim() && !categoryOptions.includes(newCategory.trim())) {
                setCategoryOptions((current) => [...current, newCategory.trim()]);
                setNewCategory("");
              }
            }}
            className="rounded-2xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((category) => (
            <div key={category} className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}>
              {category}
              <button
                type="button"
                onClick={() => setCategoryOptions((current) => current.filter((c) => c !== category))}
                className="font-bold text-rose-500"
                aria-label={`Remove ${category}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: palette.surfaceMuted, borderColor: palette.borderColor }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold" style={{ color: palette.textColor }}>Page content</h3>
          <button
            type="button"
            onClick={handleSaveContent}
            disabled={savingConfig}
            className="rounded-2xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50"
            style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}
          >
            {savingConfig ? "Saving..." : "Save content"}
          </button>
        </div>
        <textarea
          value={contentString}
          onChange={(event) => setContentString(event.target.value)}
          rows={14}
          className="w-full rounded-2xl border p-3 font-mono text-xs outline-none"
          style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceBackground, color: palette.textColor }}
        />
        {contentError ? <p className="mt-2 text-sm text-rose-600">{contentError}</p> : null}
        <p className="mt-3 text-xs" style={{ color: palette.mutedTextColor }}>
          Edit the JSON for landing page text and form step guidance. Invalid JSON cannot be saved.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search company, contact, email, phone..."
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
          style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted, color: palette.textColor }}
        />
        <input
          type="text"
          value={countyFilter}
          onChange={(event) => setCountyFilter(event.target.value)}
          placeholder="Filter by county"
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
          style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted, color: palette.textColor }}
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
          style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted, color: palette.textColor }}
        >
          <option value="">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category.toLowerCase()}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-sm" style={{ color: palette.mutedTextColor }}>
        Showing {filteredSubmissions.length} of {submissions.length} submission{submissions.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: palette.borderColor }}>
              <th className={`${tableHeadClass} py-3 pr-4`} style={{ color: palette.mutedTextColor }}>Company</th>
              <th className={`${tableHeadClass} py-3 pr-4`} style={{ color: palette.mutedTextColor }}>Contact</th>
              <th className={`${tableHeadClass} py-3 pr-4`} style={{ color: palette.mutedTextColor }}>Email</th>
              <th className={`${tableHeadClass} py-3 pr-4`} style={{ color: palette.mutedTextColor }}>Phone</th>
              <th className={`${tableHeadClass} py-3 pr-4`} style={{ color: palette.mutedTextColor }}>Coverage</th>
              <th className={`${tableHeadClass} py-3 pr-4`} style={{ color: palette.mutedTextColor }}>Categories</th>
              <th className={`${tableHeadClass} py-3 pr-4`} style={{ color: palette.mutedTextColor }}>Date</th>
              <th className={`${tableHeadClass} py-3 pr-4 text-right`} style={{ color: palette.mutedTextColor }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((item) => (
              <tr key={item.id} className="border-b" style={{ borderColor: palette.borderColor }}>
                <td className="py-3 pr-4 font-medium" style={{ color: palette.textColor }}>{item.companyName}</td>
                <td className="py-3 pr-4" style={{ color: palette.textColor }}>{item.contactPerson}</td>
                <td className="py-3 pr-4" style={{ color: palette.textColor }}>{item.email}</td>
                <td className="py-3 pr-4" style={{ color: palette.textColor }}>{item.phoneNumber}</td>
                <td className="py-3 pr-4" style={{ color: palette.textColor }}>{item.coverageMode === "countrywide" ? "Countrywide" : item.coverageDetails || item.county || "-"}</td>
                <td className="py-3 pr-4" style={{ color: palette.textColor }}>
                  {(item.productCategories || []).slice(0, 2).join(", ")}
                  {(item.productCategories || []).length > 2 ? " +" + ((item.productCategories || []).length - 2) : ""}
                </td>
                <td className="py-3 pr-4" style={{ color: palette.mutedTextColor }}>{formatDate(item.createdAt)}</td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-2xl px-3 py-2 text-xs font-semibold text-white"
                      style={{ backgroundColor: palette.primary }}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(item)}
                      className="rounded-2xl border px-3 py-2 text-xs font-semibold"
                      style={{ borderColor: palette.borderColor, color: palette.textColor }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredSubmissions.length ? (
              <tr>
                <td colSpan={8} className="py-8 text-center" style={{ color: palette.mutedTextColor }}>
                  {loading ? "Loading submissions..." : "No marketplace vendor submissions found."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border p-6 shadow-2xl" style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold" style={{ color: palette.textColor }}>Marketplace Vendor Response</h3>
              <button type="button" onClick={closeEdit} className="text-2xl" style={{ color: palette.mutedTextColor }}>×</button>
            </div>

            <div className="mt-6 space-y-5 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyField label="Company Name" value={selected.companyName} />
                <ReadOnlyField label="Contact Person" value={selected.contactPerson} />
                <ReadOnlyField label="Phone Number" value={selected.phoneNumber} />
                <ReadOnlyField label="Email Address" value={selected.email} />
                <ReadOnlyField className="md:col-span-2" label="Physical Address" value={selected.physicalAddress} />
                <ReadOnlyField className="md:col-span-2" label="Website" value={selected.website} />
                <ReadOnlyField className="md:col-span-2" label="Company Profile" value={selected.companyProfile} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyField label="Business Registration Number" value={selected.businessRegNumber} />
                <div>
                  <ReadOnlyField label="KRA PIN" value={selected.kraPin?.number || selected.kraPin || "-"} />
                  {selected.kraPin?.fileName && selected.kraPin?.fileData ? (
                    <a
                      href={getFileDownloadUrl(selected.kraPin.fileData)}
                      download={selected.kraPin.fileName}
                      className="mt-2 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold"
                      style={{ borderColor: palette.borderColor, color: palette.primary }}
                    >
                      Download KRA PIN file
                    </a>
                  ) : null}
                </div>
                <div className="md:col-span-2">
                  <ReadOnlyField label="Business Registration File" value={selected.businessRegDocument?.fileName || "-"}>
                    {selected.businessRegDocument?.fileName && selected.businessRegDocument?.fileData ? (
                      <a
                        href={getFileDownloadUrl(selected.businessRegDocument.fileData)}
                        download={selected.businessRegDocument.fileName}
                        className="mt-2 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold"
                        style={{ borderColor: palette.borderColor, color: palette.primary }}
                      >
                        Download business registration file
                      </a>
                    ) : null}
                  </ReadOnlyField>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm font-medium" style={{ color: palette.mutedTextColor }}>Relevant Certifications</div>
                  {selected.certifications?.length ? (
                    <ul className="mt-2 space-y-2">
                      {selected.certifications.map((cert, index) => (
                        <li key={index} className="rounded-2xl border p-3" style={{ borderColor: palette.borderColor }}>
                          <div style={{ color: palette.textColor }}>{cert.name || "Unnamed"}</div>
                          {cert.fileName && cert.fileData ? (
                            <a
                              href={getFileDownloadUrl(cert.fileData)}
                              download={cert.fileName}
                              className="mt-1 inline-flex items-center gap-2 text-xs font-semibold"
                              style={{ color: palette.primary }}
                            >
                              Download {cert.fileName}
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2" style={{ color: palette.mutedTextColor }}>No certificates uploaded.</p>
                  )}
                </div>
                <ReadOnlyField label="Years of Operation" value={selected.yearsOfOperation} />
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: palette.borderColor }}>
                <div className="text-sm font-medium" style={{ color: palette.mutedTextColor }}>Coverage</div>
                {selected.coverageMode === "countrywide" || (selected.coverageDetails || "").toLowerCase().includes("countrywide") ? (
                  <p className="mt-2 font-medium" style={{ color: palette.textColor }}>Countrywide delivery — all counties in Kenya</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-5" style={{ color: palette.textColor }}>
                    {(formatMarketplaceCoverage(selected) || []).map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyField className="md:col-span-2" label="Product Categories" value={(selected.productCategories || []).join(", ")} />
                <ReadOnlyField className="md:col-span-2" label="Brands Represented" value={selected.brandsRepresented} />
                <ReadOnlyField className="md:col-span-2" label="Social Media Links" value={selected.socialMediaLinks} />
                <ReadOnlyField className="md:col-span-2" label="Declaration" value={selected.declaration ? "Confirmed that the information provided is accurate and complete." : "-"} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={closeEdit} className="rounded-2xl border px-5 py-3 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await copyMarketplaceSubmission(selected);
                    setNotice("Response copied to clipboard.");
                  } catch {
                    setError("Unable to copy response.");
                  }
                }}
                className="rounded-2xl border px-5 py-3 text-sm font-semibold"
                style={{ borderColor: palette.borderColor, color: palette.textColor }}
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => downloadMarketplaceSubmissionJson(selected)}
                className="rounded-2xl border px-5 py-3 text-sm font-semibold"
                style={{ borderColor: palette.borderColor, color: palette.textColor }}
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => downloadMarketplaceSubmissionExcel(selected)}
                className="rounded-2xl border px-5 py-3 text-sm font-semibold"
                style={{ borderColor: palette.borderColor, color: palette.textColor }}
              >
                Excel
              </button>
              <button
                type="button"
                onClick={() => printMarketplaceSubmissionPdf(selected)}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: palette.primary }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[28px] border p-6 shadow-2xl" style={{ backgroundColor: palette.surfaceBackground, borderColor: palette.borderColor }}>
            <h3 className="text-xl font-semibold" style={{ color: palette.textColor }}>Delete submission?</h3>
            <p className="mt-2 text-sm" style={{ color: palette.mutedTextColor }}>
              This will permanently remove the submission from <strong>{confirmingDelete.companyName}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmingDelete(null)} className="rounded-2xl border px-5 py-3 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                Cancel
              </button>
              <button type="button" onClick={() => handleDelete(confirmingDelete.id)} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default MarketplaceVendorAdmin;
