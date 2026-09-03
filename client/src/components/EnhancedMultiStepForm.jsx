import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CountyCoverageSelector from "./CountyCoverageSelector.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import { categories } from "../data/formOptions.js";
import { checkAdminAccess, submitListing } from "../lib/api.js";
import { grantAdminAccess } from "../lib/adminAccess.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import {
  buildCoverageSummary,
  createCountyCoverageEntry,
  deriveCoverageMode,
  isCountyCoverageEntryComplete
} from "../lib/locationCoverage.js";

const createLicenseEntry = (licenseNumber = "", licenseBody = "") => ({
  id: `license-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  licenseNumber,
  licenseBody
});

const initialValues = {
  email: "",
  consent: null,
  fullName: "",
  phoneNumber: "",
  category: [],
  licenseNumber: "",
  licenseBody: "",
  licenses: [createLicenseEntry()],
  county: "",
  coverageMode: "",
  coverageDetails: "",
  countyCoverageEntries: [createCountyCoverageEntry("")],
  declineReason: ""
};

const draftStorageKey = "kerea-form-draft-v1";

const normalizeCategorySelection = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => `${item || ""}`.trim()).filter(Boolean))];
  }

  if (typeof value === "string") {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeLicenseEntries = (formValues = {}) => {
  if (Array.isArray(formValues.licenses) && formValues.licenses.length) {
    return formValues.licenses.map((entry) =>
      createLicenseEntry(`${entry?.licenseNumber || ""}`, `${entry?.licenseBody || ""}`)
    );
  }

  return [createLicenseEntry(`${formValues.licenseNumber || ""}`, `${formValues.licenseBody || ""}`)];
};

const normalizeCountyCoverageEntry = (entry = {}) => {
  const baseEntry = createCountyCoverageEntry("");

  return {
    ...baseEntry,
    ...entry,
    id: entry.id || baseEntry.id,
    county: entry.county || "",
    subCountyMode: entry.subCountyMode || "",
    wardMode: entry.wardMode || "",
    selectedSubCounties: Array.isArray(entry.selectedSubCounties) ? entry.selectedSubCounties : [],
    selectedWardsBySubCounty:
      entry.selectedWardsBySubCounty &&
      typeof entry.selectedWardsBySubCounty === "object" &&
      !Array.isArray(entry.selectedWardsBySubCounty)
        ? Object.fromEntries(
            Object.entries(entry.selectedWardsBySubCounty).map(([subCounty, wards]) => [
              subCounty,
              Array.isArray(wards) ? wards : []
            ])
          )
        : {}
  };
};

const clampStepIndex = (value, consent) => {
  const nextSteps = getSteps(consent);
  const normalizedValue = Number.isFinite(value) ? value : 0;

  return Math.min(Math.max(normalizedValue, 0), nextSteps.length - 1);
};

const loadDraftState = () => {
  if (typeof window === "undefined") {
    return {
      formValues: initialValues,
      stepIndex: 0
    };
  }

  try {
    const rawDraft = window.localStorage.getItem(draftStorageKey);

    if (!rawDraft) {
      return {
        formValues: initialValues,
        stepIndex: 0
      };
    }

    const parsedDraft = JSON.parse(rawDraft);
    const countyCoverageEntries = Array.isArray(parsedDraft.formValues?.countyCoverageEntries)
      ? parsedDraft.formValues.countyCoverageEntries.map((entry) => normalizeCountyCoverageEntry(entry))
      : initialValues.countyCoverageEntries;
    const formValues = {
      ...initialValues,
      ...(parsedDraft.formValues || {}),
      category: normalizeCategorySelection(parsedDraft.formValues?.category),
      licenses: normalizeLicenseEntries(parsedDraft.formValues),
      countyCoverageEntries: countyCoverageEntries.length ? countyCoverageEntries : initialValues.countyCoverageEntries
    };

    return {
      formValues,
      stepIndex: clampStepIndex(parsedDraft.stepIndex, formValues.consent)
    };
  } catch {
    return {
      formValues: initialValues,
      stepIndex: 0
    };
  }
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const gmailTypoDomains = new Set([
  "gmai.com",
  "gmial.com",
  "gmal.com",
  "gamil.com",
  "gnail.com",
  "gmail.con",
  "gmail.co",
  "gmail.cm",
  "gmail.om",
  "gmail.cpm",
  "gmail.comm"
]);
const kenyanPhonePattern = /^\+254[17]\d{8}$/;

const getEmailError = (value) => {
  const email = `${value || ""}`.trim().toLowerCase();

  if (!email) {
    return "Email is required.";
  }

  if (!emailPattern.test(email)) {
    return "Enter a valid email address.";
  }

  const domain = email.split("@")[1] || "";

  if (gmailTypoDomains.has(domain)) {
    return "Did you mean @gmail.com? Please correct the email address.";
  }

  return "";
};

const normalizePhone = (value) => {
  const rawInput = `${value || ""}`.trim();
  const raw = rawInput.replace(/[\s()-]/g, "");

  if (!raw) {
    return "";
  }

  if (!/^\+?\d+$/.test(raw)) {
    return raw;
  }

  if (/^\+254\d{9}$/.test(raw)) {
    return raw;
  }

  if (/^254\d{9}$/.test(raw)) {
    return `+${raw}`;
  }

  if (/^0\d{9}$/.test(raw)) {
    return `+254${raw.slice(1)}`;
  }

  if (/^[17]\d{8}$/.test(raw)) {
    return `+254${raw}`;
  }

  return raw;
};

const getSteps = (consent) => {
  if (consent === false) {
    return [
      { id: "consent", title: "Consent" },
      { id: "decline", title: "Reason" },
      { id: "review", title: "Review" }
    ];
  }

  return [
    { id: "consent", title: "Consent" },
    { id: "details", title: "Details" },
    { id: "location", title: "Location" },
    { id: "review", title: "Review" }
  ];
};

const coverageOptions = [
  {
    value: "all_wards_in_county",
    title: "All wards in this county",
    description: "Choose this if you serve the whole county and do not need to list every ward."
  },
  {
    value: "specific_areas",
    title: "Specific sub-counties or wards",
    description: "List only the areas you actively serve within the selected county."
  },
  {
    value: "multiple_counties",
    title: "This county plus other counties",
    description: "Use one primary county here, then list the other counties or key areas in one short note."
  }
];

const FloatingField = ({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  helper,
  as = "input",
  rows = 4,
  palette,
  activeTrace = false,
  ...props
}) => {
  const compactLabel = label.length > 38;
  const classes = `${activeTrace ? "field-trace border-transparent" : "border-2"} peer w-full rounded-2xl px-4 pb-3 pt-6 text-sm shadow-sm outline-none transition placeholder:text-transparent focus:ring-4 sm:text-base ${
    error ? "focus:ring-rose-100" : "focus:ring-slate-100"
  }`;
  const labelClass = compactLabel
    ? "pointer-events-none absolute left-4 right-4 top-2 whitespace-nowrap text-[8px] font-medium leading-none transition peer-placeholder-shown:top-4 peer-placeholder-shown:text-[8px] peer-focus:top-2 peer-focus:text-[8px] sm:text-xs sm:peer-placeholder-shown:text-sm sm:peer-focus:text-xs"
    : "pointer-events-none absolute left-4 right-4 top-2 text-[11px] font-medium leading-tight transition peer-placeholder-shown:top-3 peer-placeholder-shown:text-[12px] peer-focus:top-2 peer-focus:text-[11px] sm:text-xs sm:peer-placeholder-shown:top-4 sm:peer-placeholder-shown:text-base sm:peer-focus:top-2 sm:peer-focus:text-xs";

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
            className={`${classes} resize-none`}
            style={{
              backgroundColor: palette.fieldBackground || palette.surfaceBackground,
              color: palette.textColor,
              borderColor: error ? "#f43f5e" : activeTrace ? "transparent" : "#94a3b8",
              "--trace-color": error ? "#f43f5e" : palette.primary,
              "--trace-accent": palette.primarySoft,
              "--trace-fill": palette.fieldBackground || palette.surfaceBackground
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
            {...props}
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
              borderColor: error ? "#f43f5e" : activeTrace ? "transparent" : "#94a3b8",
              "--trace-color": error ? "#f43f5e" : palette.primary,
              "--trace-accent": palette.primarySoft,
              "--trace-fill": palette.fieldBackground || palette.surfaceBackground
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
            {...props}
          />
        )}
        <label
          htmlFor={id}
          className={labelClass}
          style={{ color: error ? "#e11d48" : palette.mutedTextColor }}
        >
          {label}
        </label>
      </div>
      {helper ? (
        <p id={`${id}-helper`} className="text-sm" style={{ color: palette.mutedTextColor }}>
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

const RadioCard = ({ title, description, checked, onClick, activeColor, softColor, textColor }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-3xl border p-4 text-left transition ${
      checked ? "shadow-md" : "hover:border-slate-300 hover:bg-white"
    }`}
    style={{
      borderColor: checked ? activeColor : "#e2e8f0",
      backgroundColor: checked ? softColor : "rgba(255,255,255,0.88)"
    }}
  >
    <div className="flex items-start gap-3">
      <div
        className="mt-1 h-5 w-5 rounded-full border-2"
        style={{
          borderColor: checked ? activeColor : "#cbd5e1",
          backgroundColor: checked ? activeColor : "transparent",
          boxShadow: checked ? `0 0 0 6px ${softColor}` : "none"
        }}
      />
      <div>
        <h3 className="font-semibold" style={{ color: textColor }}>
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  </button>
);

const Stepper = ({ steps, currentIndex, palette, onStepSelect }) => (
  <div className={`grid grid-cols-2 gap-3 ${steps.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
    {steps.map((step, index) => {
      const active = index === currentIndex;
      const complete = index < currentIndex;

      return (
        <button
          key={step.id}
          type="button"
          onClick={() => onStepSelect(index)}
          className="rounded-2xl border px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 sm:px-4"
          style={{
            borderColor: active ? palette.primary : complete ? palette.primarySoft : "#e2e8f0",
            backgroundColor: active ? palette.accent : "rgba(255,255,255,0.9)",
            "--tw-ring-color": palette.primaryGlow
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: active || complete ? palette.primary : palette.primarySoft,
                color: active || complete ? palette.textOnPrimary || "#ffffff" : palette.primaryDeep
              }}
            >
              {index + 1}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
              Step
            </div>
          </div>
          <div className="mt-2 text-sm font-semibold leading-snug sm:text-base" style={{ color: active ? palette.primaryDeep : "#0f172a" }}>
            {step.title}
          </div>
        </button>
      );
    })}
  </div>
);

const SummaryItem = ({ label, value, error, action, children }) => (
  <div className={`rounded-2xl border-2 p-4 ${error ? "border-rose-400 bg-rose-50 ring-2 ring-rose-100" : "border-slate-300 bg-slate-50"}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">{label}</div>
      {action ? (
        <button type="button" onClick={action.onClick} className="shrink-0 rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 transition hover:bg-sky-100">
          {action.label}
        </button>
      ) : null}
    </div>
    <div className="mt-2 break-words text-sm text-slate-800">{children || value || "Not provided"}</div>
    {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
  </div>
);

const getReviewErrorLabel = (field) =>
  ({
    email: "Email address",
    consent: "Consent selection",
    fullName: "Name",
    phoneNumber: "Phone number",
    category: "Categories",
    county: "County coverage",
    coverageMode: "Sub-county / ward coverage",
    coverageDetails: "Coverage details"
  })[field] || field;

const EnhancedMultiStepForm = ({ onStepChange }) => {
  const navigate = useNavigate();
  const { palette } = useSiteSettings();
  const [draftState] = useState(() => loadDraftState());
  const [formValues, setFormValues] = useState(draftState.formValues);
  const [stepIndex, setStepIndex] = useState(draftState.stepIndex);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [reviewEditState, setReviewEditState] = useState({ email: false, phoneNumber: false });

  const steps = useMemo(() => getSteps(formValues.consent), [formValues.consent]);
  const currentStep = steps[stepIndex]?.id || "consent";

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const deriveCoverageState = (countyCoverageEntries) => {
    const completedEntries = countyCoverageEntries.filter((entry) => isCountyCoverageEntryComplete(entry));
    const firstCounty = countyCoverageEntries.find((entry) => entry.county)?.county || "";

    return {
      county: completedEntries[0]?.county || firstCounty,
      coverageMode: completedEntries.length ? deriveCoverageMode(completedEntries) : "",
      coverageDetails: buildCoverageSummary(completedEntries)
    };
  };

  useEffect(() => {
    setStepIndex((current) => clampStepIndex(current, formValues.consent));
  }, [formValues.consent]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasDraftContent = Boolean(
      formValues.email ||
        formValues.consent !== null ||
        formValues.fullName ||
        formValues.phoneNumber ||
        formValues.category.length ||
        formValues.licenseNumber ||
        formValues.licenseBody ||
        formValues.declineReason ||
        formValues.countyCoverageEntries.some((entry) =>
          Boolean(
            entry.county ||
              entry.subCountyMode ||
              entry.wardMode ||
              entry.selectedSubCounties.length ||
              Object.keys(entry.selectedWardsBySubCounty || {}).length
          )
        )
    );

    if (!hasDraftContent) {
      window.localStorage.removeItem(draftStorageKey);
      return;
    }

    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        formValues,
        stepIndex: clampStepIndex(stepIndex, formValues.consent)
      })
    );
  }, [formValues, stepIndex]);

  const updateCountyCoverageEntries = (countyCoverageEntries) => {
    setFormValues((current) => ({
      ...current,
      countyCoverageEntries,
      ...deriveCoverageState(countyCoverageEntries)
    }));

    setErrors((current) => ({
      ...current,
      county: undefined,
      coverageMode: undefined,
      coverageDetails: undefined
    }));
    setReviewEditState((current) => ({ ...current, phoneNumber: false }));
    setServerError("");
  };

  const updateField = (field, value) => {
    setFormValues((current) => {
      const next = { ...current, [field]: value };

      if (field === "consent" && value === false) {
        next.fullName = "";
        next.phoneNumber = "";
        next.category = [];
        next.licenseNumber = "";
        next.licenseBody = "";
        next.licenses = [createLicenseEntry()];
        next.county = "";
        next.coverageMode = "";
        next.coverageDetails = "";
        next.countyCoverageEntries = [createCountyCoverageEntry("")];
      }

      if (field === "consent" && value === true) {
        next.declineReason = "";
      }

      return next;
    });

    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  };

  const updateLicenseEntry = (licenseId, field, value) => {
    setFormValues((current) => {
      const licenses = current.licenses.map((license) =>
        license.id === licenseId ? { ...license, [field]: value } : license
      );

      return {
        ...current,
        licenses,
        licenseNumber: licenses.map((license) => license.licenseNumber.trim()).filter(Boolean).join(" | "),
        licenseBody: licenses.map((license) => license.licenseBody.trim()).filter(Boolean).join(" | ")
      };
    });
    setServerError("");
  };

  const addLicenseEntry = () => {
    setFormValues((current) => ({
      ...current,
      licenses: [...current.licenses, createLicenseEntry()]
    }));
    setServerError("");
  };

  const removeLicenseEntry = (licenseId) => {
    setFormValues((current) => {
      const licenses = current.licenses.filter((license) => license.id !== licenseId);
      const nextLicenses = licenses.length ? licenses : [createLicenseEntry()];

      return {
        ...current,
        licenses: nextLicenses,
        licenseNumber: nextLicenses.map((license) => license.licenseNumber.trim()).filter(Boolean).join(" | "),
        licenseBody: nextLicenses.map((license) => license.licenseBody.trim()).filter(Boolean).join(" | ")
      };
    });
    setServerError("");
  };
 
   const openReviewEditor = (field) => {
     setReviewEditState((current) => ({ ...current, [field]: !current[field] }));
   };
 
   const activeDetailsField = errors.fullName
     ? "fullName"
     : errors.phoneNumber
       ? "phoneNumber"
       : errors.category
         ? "category"
         : !formValues.fullName.trim()
           ? "fullName"
           : !normalizePhone(formValues.phoneNumber)
             ? "phoneNumber"
             : !formValues.category.length
               ? "category"
               : "";

  const visibleLicenses = formValues.licenses.length ? formValues.licenses : [createLicenseEntry()];
  const hasStartedLicense = visibleLicenses.some((license) => license.licenseNumber.trim());
  const serializedLicenseNumber = visibleLicenses.map((license) => license.licenseNumber.trim()).filter(Boolean).join(" | ");
  const serializedLicenseBody = visibleLicenses.map((license) => license.licenseBody.trim()).filter(Boolean).join(" | ");

  const validateAll = () => {
    const nextErrors = {};
    const normalizedPhone = normalizePhone(formValues.phoneNumber);
    const completedCountyCoverageEntries = formValues.countyCoverageEntries.filter((entry) => isCountyCoverageEntryComplete(entry));
    const hasStartedCountyCoverage = formValues.countyCoverageEntries.some((entry) => entry.county);
    const hasIncompleteCountyCoverage = formValues.countyCoverageEntries.some(
      (entry) => entry.county && !isCountyCoverageEntryComplete(entry)
    );

    const emailError = getEmailError(formValues.email);

    if (emailError) {
      nextErrors.email = emailError;
    }

    if (formValues.consent === null) {
      nextErrors.consent = "Please choose whether you want to be listed.";
    }

    if (formValues.consent === true) {
      if (!formValues.fullName.trim()) {
        nextErrors.fullName = "Full name is required.";
      }

      if (!normalizedPhone) {
        nextErrors.phoneNumber = "Phone number is required.";
      } else if (!kenyanPhonePattern.test(normalizedPhone)) {
        nextErrors.phoneNumber = "Use a valid Kenyan number such as +254712345678.";
      }

      if (!formValues.category.length) {
        nextErrors.category = "Select at least one stakeholder category.";
      }

      if (!hasStartedCountyCoverage) {
        nextErrors.county = "Select at least one county of operation.";
      }

      if (!completedCountyCoverageEntries.length || hasIncompleteCountyCoverage) {
        nextErrors.coverageMode = "Complete the county, sub-county, and ward dropdowns for each county you add.";
      }

      if (!buildCoverageSummary(completedCountyCoverageEntries)) {
        nextErrors.coverageDetails = "Coverage details are required.";
      }
    }

    return nextErrors;
  };

  const validateCurrentStep = () => {
    const allErrors = validateAll();
    const stepFields = {
      consent: ["email", "consent"],
      details: ["fullName", "phoneNumber", "category"],
      location: ["county", "coverageMode", "coverageDetails"],
      decline: [],
      review: Object.keys(allErrors)
    };

    const relevantErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([field]) => stepFields[currentStep].includes(field))
    );

    setErrors((current) => ({
      ...current,
      ...Object.fromEntries(stepFields[currentStep].map((field) => [field, undefined])),
      ...relevantErrors
    }));
    return Object.keys(relevantErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep === "consent" && formValues.consent === false) {
      setCheckingAdmin(true);
      try {
        const result = await checkAdminAccess({
          email: formValues.email.trim().toLowerCase(),
          consent: false
        });

        if (result.allowed) {
          const email = formValues.email.trim().toLowerCase();
          grantAdminAccess(email);
          navigate("/admin", {
            state: {
              gate: "hidden",
              prefillEmail: email
            }
          });
          return;
        }
      } catch {
        setServerError("");
      } finally {
        setCheckingAdmin(false);
      }
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setServerError("");
    setStepIndex((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepSelect = (targetIndex) => {
    setServerError("");
    setStepIndex(Math.max(0, Math.min(targetIndex, steps.length - 1)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const nextErrors = validateAll();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setReviewEditState((current) => ({
        ...current,
        email: Boolean(nextErrors.email),
        consent: Boolean(nextErrors.consent),
        fullName: Boolean(nextErrors.fullName),
        phoneNumber: Boolean(nextErrors.phoneNumber),
        category: Boolean(nextErrors.category),
        coverage: Boolean(nextErrors.county || nextErrors.coverageMode || nextErrors.coverageDetails)
      }));
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      await submitListing({
        ...formValues,
        email: formValues.email.trim().toLowerCase(),
        phoneNumber: normalizePhone(formValues.phoneNumber),
        category: formValues.category.join(" | "),
        categories: formValues.category,
        licenseNumber: serializedLicenseNumber,
        licenseBody: serializedLicenseBody,
        county: formValues.county,
        coverageMode: formValues.coverageMode,
        coverageDetails: formValues.coverageDetails.trim()
      });

      navigate("/success", {
        replace: true,
        state: {
          email: formValues.email.trim(),
          consent: formValues.consent
        }
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftStorageKey);
      }
    } catch (error) {
      if (error.data?.errors) {
        setErrors((current) => ({ ...current, ...error.data.errors }));
        setReviewEditState((current) => ({
          ...current,
          email: Boolean(error.data.errors.email),
          fullName: Boolean(error.data.errors.fullName),
          phoneNumber: Boolean(error.data.errors.phoneNumber),
          category: Boolean(error.data.errors.category),
          coverage: Boolean(error.data.errors.county || error.data.errors.coverageMode || error.data.errors.coverageDetails)
        }));
      }
      setServerError(error.message || "Unable to submit the form right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const isReviewValid = Object.keys(validateAll()).length === 0;
  const reviewErrors = Object.entries(errors).filter(([, message]) => Boolean(message));
  const busy = submitting || checkingAdmin;

  return (
    <div className="space-y-6">
      <Stepper steps={steps} currentIndex={stepIndex} palette={palette} onStepSelect={handleStepSelect} />

      <div className="rounded-[30px] border border-white/40 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
              KEREA USSD Listing Form
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {currentStep === "consent" && "Confirm your consent"}
              {currentStep === "details" && "Share your professional details"}
              {currentStep === "location" && "Tell us where you operate"}
              {currentStep === "decline" && "Anything you’d like us to note?"}
              {currentStep === "review" && "Review before you submit"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              {currentStep === "consent" &&
                "We’ll only use this information to review your listing request for the KEREA USSD platform."}
              {currentStep === "details" &&
                "This helps clients find you faster and ensures the directory stays trusted and useful."}
              {currentStep === "location" &&
                "Select each county you serve, then choose whether you cover all sub-counties and wards or only specific areas."}
              {currentStep === "decline" &&
                "Optional, but helpful if your organization may want to participate later."}
              {currentStep === "review" &&
                "Please check the details below before sending them for review."}
            </p>
          </div>
          <div className="rounded-2xl px-4 py-3 text-right" style={{ backgroundColor: palette.accent }}>
            <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
              Progress
            </div>
            <div className="mt-1 text-sm font-medium" style={{ color: palette.primaryDeep }}>
              {stepIndex + 1} of {steps.length}
            </div>
          </div>
        </div>

        <div key={`step-${currentStep}`} className="step-enter min-h-[320px]">
          {currentStep === "consent" ? (
            <div className="space-y-5">
              <FloatingField
                id="email"
                label="Email address"
                type="email"
                value={formValues.email}
                onChange={(event) => updateField("email", event.target.value)}
                error={errors.email}
                helper="We’ll use this to contact you about your submission review."
                autoComplete="email"
                palette={palette}
                activeTrace={!formValues.email.trim() || Boolean(errors.email)}
              />

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-slate-700">Would you like to be listed?</div>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose the option that best reflects your preference today.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <RadioCard
                    title="Yes, I’m happy to be listed"
                    description="Continue to share your professional details for review."
                    checked={formValues.consent === true}
                    onClick={() => updateField("consent", true)}
                    activeColor={palette.primary}
                    softColor={palette.primarySoft}
                    textColor={palette.primaryDeep}
                  />
                  <RadioCard
                    title="No, I prefer not to be listed"
                    description="You can still leave a short note to help us understand your decision."
                    checked={formValues.consent === false}
                    onClick={() => updateField("consent", false)}
                    activeColor={palette.primary}
                    softColor={palette.primarySoft}
                    textColor={palette.primaryDeep}
                  />
                </div>
                {errors.consent ? <p className="text-sm text-rose-600">{errors.consent}</p> : null}
              </div>
            </div>
          ) : null}

          {currentStep === "details" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <FloatingField
                  id="fullName"
                  label="Name as it should appear on the KEREA USSD platform"
                  value={formValues.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  error={errors.fullName}
                  helper="Usually this is your business or organization name. If you operate under a personal name, enter it exactly as you want it displayed on KEREA."
                  autoComplete="name"
                  palette={palette}
                  activeTrace={activeDetailsField === "fullName"}
                />
              </div>
              <FloatingField
                id="phoneNumber"
                label="Phone number"
                value={formValues.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                error={errors.phoneNumber}
                helper="Accepted formats include 0712345678 or +254712345678."
                autoComplete="tel"
                palette={palette}
                activeTrace={activeDetailsField === "phoneNumber"}
              />
              <MultiSelectDropdown
                id="category"
                label="Categories"
                values={formValues.category}
                onChange={(selection) => updateField("category", selection)}
                options={categories}
                error={errors.category}
                helper="Choose one or more roles this company should appear under."
                placeholder="Select one or more roles"
                activeTrace={activeDetailsField === "category"}
                clearLabel="Clear roles"
                doneLabel="Done selecting roles"
              />
              <div className="space-y-4 md:col-span-2">
                {visibleLicenses.map((license, index) => {
                  const hasLicenseNumber = license.licenseNumber.trim();

                  return (
                    <div key={license.id} className="grid gap-4 rounded-[24px] border p-4 md:grid-cols-2" style={{ borderColor: palette.borderColor, backgroundColor: palette.surfaceMuted }}>
                      <div className="md:col-span-2 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold" style={{ color: palette.primaryDeep }}>
                          License {index + 1}
                        </div>
                        {visibleLicenses.length > 1 ? (
                          <button type="button" onClick={() => removeLicenseEntry(license.id)} className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <FloatingField
                        id={`license-number-${license.id}`}
                        label="EPRA / relevant professional license number"
                        value={license.licenseNumber}
                        onChange={(event) => updateLicenseEntry(license.id, "licenseNumber", event.target.value)}
                        helper={index === 0 ? "Optional, but it strengthens trust in your listing." : ""}
                        palette={palette}
                      />
                      {hasLicenseNumber ? (
                        <FloatingField
                          id={`license-body-${license.id}`}
                          label="License body or issuing authority"
                          value={license.licenseBody}
                          onChange={(event) => updateLicenseEntry(license.id, "licenseBody", event.target.value)}
                          helper="For example: EPRA, NCA, or another relevant professional body."
                          palette={palette}
                        />
                      ) : null}
                    </div>
                  );
                })}
                {hasStartedLicense ? (
                  <button type="button" onClick={addLicenseEntry} className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                    Add another license
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {currentStep === "location" ? (
            <div className="space-y-5">
              <CountyCoverageSelector
                entries={formValues.countyCoverageEntries}
                onChange={updateCountyCoverageEntries}
                errors={{
                  county: errors.county,
                  coverageMode: errors.coverageMode,
                  coverageDetails: errors.coverageDetails
                }}
              />
              <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: palette.accent, color: palette.primaryDeep }}>
                If you cover all sub-counties and wards in a county, you can immediately add another county without filling sub-county coverage.
              </div>
            </div>
          ) : null}

          {currentStep === "decline" ? (
            <div className="space-y-5">
              <FloatingField
                id="declineReason"
                label="Reason for declining"
                as="textarea"
                rows={6}
                value={formValues.declineReason}
                onChange={(event) => updateField("declineReason", event.target.value)}
                helper="Optional, but encouraged if you’d like us to improve the process for your organization."
                palette={palette}
              />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                You can always return later if you decide to participate in the listing.
              </div>
            </div>
          ) : null}

          {currentStep === "review" ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <SummaryItem
                  label="Email"
                  error={errors.email}
                  action={{
                    label: reviewEditState.email ? "Done" : "Edit",
                    onClick: () => openReviewEditor("email")
                  }}
                >
                  {reviewEditState.email ? (
                    <FloatingField
                      id="review-email"
                      label="Email address"
                      type="email"
                      value={formValues.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      error={errors.email}
                      helper="Update this and submit again."
                      autoComplete="email"
                      palette={palette}
                      activeTrace
                    />
                  ) : (
                    formValues.email
                  )}
                </SummaryItem>
                <SummaryItem
                  label="Consent"
                  action={{
                    label: reviewEditState.consent ? "Done" : "Edit",
                    onClick: () => openReviewEditor("consent")
                  }}
                >
                  {reviewEditState.consent ? (
                    <div className="grid gap-3">
                      <RadioCard
                        title="Yes, I’m happy to be listed"
                        description="Continue with listing details."
                        checked={formValues.consent === true}
                        onClick={() => updateField("consent", true)}
                        activeColor={palette.primary}
                        softColor={palette.primarySoft}
                        textColor={palette.primaryDeep}
                      />
                      <RadioCard
                        title="No, I prefer not to be listed"
                        description="Submit a decline note instead."
                        checked={formValues.consent === false}
                        onClick={() => updateField("consent", false)}
                        activeColor={palette.primary}
                        softColor={palette.primarySoft}
                        textColor={palette.primaryDeep}
                      />
                    </div>
                  ) : (
                    formValues.consent ? "Yes, happy to be listed" : "No, prefer not to be listed"
                  )}
                </SummaryItem>
                {formValues.consent ? (
                  <>
                    <SummaryItem
                      label="Full name"
                      error={errors.fullName}
                      action={{
                        label: reviewEditState.fullName ? "Done" : "Edit",
                        onClick: () => openReviewEditor("fullName")
                      }}
                    >
                      {reviewEditState.fullName ? (
                        <FloatingField
                          id="review-full-name"
                          label="Name as it should appear on the KEREA USSD platform"
                          value={formValues.fullName}
                          onChange={(event) => updateField("fullName", event.target.value)}
                          error={errors.fullName}
                          palette={palette}
                          activeTrace
                        />
                      ) : (
                        formValues.fullName
                      )}
                    </SummaryItem>
                    <SummaryItem
                      label="Phone number"
                      error={errors.phoneNumber}
                      action={{
                        label: reviewEditState.phoneNumber ? "Done" : "Edit",
                        onClick: () => openReviewEditor("phoneNumber")
                      }}
                    >
                      {reviewEditState.phoneNumber ? (
                        <FloatingField
                          id="review-phone-number"
                          label="Phone number"
                          value={formValues.phoneNumber}
                          onChange={(event) => updateField("phoneNumber", event.target.value)}
                          error={errors.phoneNumber}
                          helper="Use a Kenyan number such as +254712345678."
                          autoComplete="tel"
                          palette={palette}
                          activeTrace
                        />
                      ) : (
                        normalizePhone(formValues.phoneNumber)
                      )}
                    </SummaryItem>
                    <SummaryItem
                      label="Categories"
                      error={errors.category}
                      action={{
                        label: reviewEditState.category ? "Done" : "Edit",
                        onClick: () => openReviewEditor("category")
                      }}
                    >
                      {reviewEditState.category ? (
                        <MultiSelectDropdown
                          id="review-category"
                          label="Categories"
                          values={formValues.category}
                          onChange={(selection) => updateField("category", selection)}
                          options={categories}
                          error={errors.category}
                          placeholder="Select one or more roles"
                          clearLabel="Clear roles"
                          doneLabel="Done selecting roles"
                          activeTrace
                        />
                      ) : (
                        formValues.category.join(", ")
                      )}
                    </SummaryItem>
                    <SummaryItem
                      label="Licenses"
                      action={{
                        label: reviewEditState.licenses ? "Done" : "Edit",
                        onClick: () => openReviewEditor("licenses")
                      }}
                    >
                      {reviewEditState.licenses ? (
                        <div className="space-y-4">
                          {visibleLicenses.map((license, index) => (
                            <div key={license.id} className="grid gap-3 rounded-2xl border p-3 md:grid-cols-2" style={{ borderColor: palette.borderColor }}>
                              <div className="md:col-span-2 flex items-center justify-between gap-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: palette.primaryDeep }}>
                                  License {index + 1}
                                </div>
                                {visibleLicenses.length > 1 ? (
                                  <button type="button" onClick={() => removeLicenseEntry(license.id)} className="text-xs font-semibold text-rose-600">
                                    Remove
                                  </button>
                                ) : null}
                              </div>
                              <FloatingField
                                id={`review-license-number-${license.id}`}
                                label="EPRA / relevant professional license number"
                                value={license.licenseNumber}
                                onChange={(event) => updateLicenseEntry(license.id, "licenseNumber", event.target.value)}
                                palette={palette}
                                activeTrace
                              />
                              {license.licenseNumber.trim() ? (
                                <FloatingField
                                  id={`review-license-body-${license.id}`}
                                  label="License body or issuing authority"
                                  value={license.licenseBody}
                                  onChange={(event) => updateLicenseEntry(license.id, "licenseBody", event.target.value)}
                                  palette={palette}
                                  activeTrace
                                />
                              ) : null}
                            </div>
                          ))}
                          {hasStartedLicense ? (
                            <button type="button" onClick={addLicenseEntry} className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: palette.borderColor, color: palette.textColor }}>
                              Add another license
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        serializedLicenseNumber
                          ? visibleLicenses
                              .filter((license) => license.licenseNumber.trim())
                              .map((license) => `${license.licenseNumber.trim()}${license.licenseBody.trim() ? ` (${license.licenseBody.trim()})` : ""}`)
                              .join(", ")
                          : "Not provided"
                      )}
                    </SummaryItem>
                    <SummaryItem
                      label="Counties"
                      error={errors.county || errors.coverageMode || errors.coverageDetails}
                      action={{
                        label: reviewEditState.coverage ? "Done" : "Edit",
                        onClick: () => openReviewEditor("coverage")
                      }}
                      value={formValues.countyCoverageEntries.filter((entry) => entry.county).map((entry) => entry.county).join(", ")}
                    >
                      {reviewEditState.coverage ? (
                        <CountyCoverageSelector
                          entries={formValues.countyCoverageEntries}
                          onChange={updateCountyCoverageEntries}
                          errors={{
                            county: errors.county,
                            coverageMode: errors.coverageMode,
                            coverageDetails: errors.coverageDetails
                          }}
                        />
                      ) : (
                        formValues.countyCoverageEntries.filter((entry) => entry.county).map((entry) => entry.county).join(", ")
                      )}
                    </SummaryItem>
                    <SummaryItem
                      label="Coverage"
                      error={errors.coverageDetails || errors.coverageMode}
                      action={{
                        label: reviewEditState.coverage ? "Done" : "Edit",
                        onClick: () => openReviewEditor("coverage")
                      }}
                      value={formValues.coverageDetails}
                    />
                  </>
                ) : (
                  <SummaryItem
                    label="Decline reason"
                    action={{
                      label: reviewEditState.declineReason ? "Done" : "Edit",
                      onClick: () => openReviewEditor("declineReason")
                    }}
                  >
                    {reviewEditState.declineReason ? (
                      <FloatingField
                        id="review-decline-reason"
                        label="Reason for declining"
                        as="textarea"
                        rows={6}
                        value={formValues.declineReason}
                        onChange={(event) => updateField("declineReason", event.target.value)}
                        palette={palette}
                        activeTrace
                      />
                    ) : (
                      formValues.declineReason
                    )}
                  </SummaryItem>
                )}
              </div>
              {reviewErrors.length ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <div className="font-semibold">Please correct the highlighted fields before submitting:</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {reviewErrors.map(([field, message]) => (
                      <li key={field}>
                        <span className="font-semibold">{getReviewErrorLabel(field)}:</span> {message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {serverError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <div className="sticky bottom-4 mt-8 rounded-3xl border border-white/50 bg-white/95 p-3 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0 || busy}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            {currentStep === "review" ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
                style={{ backgroundColor: busy ? undefined : palette.primary }}
              >
                {submitting ? "Submitting..." : "Submit listing request"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
                style={{ backgroundColor: busy ? undefined : palette.primary }}
              >
                {checkingAdmin ? "Checking access..." : "Next step"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMultiStepForm;
