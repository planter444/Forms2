import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import CountyCoverageSelector from "./CountyCoverageSelector.jsx";
import { getMarketplaceSettings, submitMarketplaceVendor } from "../lib/api.js";
import {
  buildCoverageSummary,
  createCountyCoverageEntry,
  deriveCoverageMode,
  isCountyCoverageEntryComplete
} from "../lib/locationCoverage.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const kenyanPhonePattern = /^\+254[17]\d{8}$/;

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

const readFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve({ fileName: "", fileData: "" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => resolve({ fileName: file.name, fileData: event.target.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getEmailError = (value) => {
  const email = `${value || ""}`.trim().toLowerCase();
  if (!email) {
    return "Email address is required.";
  }
  if (!emailPattern.test(email)) {
    return "Enter a valid email address.";
  }
  return "";
};

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
  required = false,
  className = "",
  style: fieldStyle = {},
  hidden = false,
  ...props
}) => {
  const { palette } = useSiteSettings();
  if (hidden) return null;
  const classes = `border-2 peer w-full rounded-2xl px-4 pb-3 pt-6 text-sm shadow-sm outline-none transition placeholder:text-transparent focus:ring-4 sm:text-base ${
    error ? "focus:ring-rose-100" : "focus:ring-slate-100"
  }`;
  const labelClass =
    "pointer-events-none absolute left-4 right-4 top-2 text-[11px] font-medium leading-tight transition peer-placeholder-shown:top-3 peer-placeholder-shown:text-[12px] peer-focus:top-2 peer-focus:text-[11px] sm:text-xs sm:peer-placeholder-shown:top-4 sm:peer-placeholder-shown:text-base sm:peer-focus:top-2 sm:peer-focus:text-xs";

  return (
    <div className={`space-y-2 ${className}`}>
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
              borderColor: error ? "#f43f5e" : "#94a3b8",
              ...fieldStyle
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
              borderColor: error ? "#f43f5e" : "#94a3b8",
              ...fieldStyle
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
            {...props}
          />
        )}
        <label htmlFor={id} className={labelClass} style={{ color: error ? "#e11d48" : palette.mutedTextColor }}>
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
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
    className={`rounded-3xl border p-4 text-left transition ${checked ? "shadow-md" : "hover:border-slate-300 hover:bg-white"}`}
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

const Stepper = ({ steps, currentIndex, palette, onClick }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
    {steps.map((step, index) => {
      const active = index === currentIndex;
      const complete = index < currentIndex;

      return (
        <button
          key={step.id}
          type="button"
          onClick={() => onClick(index)}
          className="rounded-2xl border px-3 py-3 text-left shadow-sm transition sm:px-4"
          style={{
            borderColor: active ? palette.primary : complete ? palette.primarySoft : "#e2e8f0",
            backgroundColor: active ? palette.accent : "rgba(255,255,255,0.9)"
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
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">Step</div>
          </div>
          <div className="mt-2 text-sm font-semibold leading-snug sm:text-base" style={{ color: active ? palette.primaryDeep : "#0f172a" }}>
            {step.title}
          </div>
        </button>
      );
    })}
  </div>
);

const steps = [
  { id: "company", title: "Company" },
  { id: "verification", title: "Verification" },
  { id: "coverage", title: "Coverage" },
  { id: "products", title: "Products" },
  { id: "review", title: "Review" }
];

const yearsOptions = ["Less than 1 Year", "1 – 3 Years", "4 – 7 Years", "8 – 10 Years", "More than 10 Years"];

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

const initialValues = {
  companyName: "",
  contactPerson: "",
  phoneNumber: "",
  email: "",
  physicalAddress: "",
  website: "",
  companyProfile: "",
  businessRegNumber: "",
  businessRegDocument: { fileName: "", fileData: "" },
  kraPin: { number: "", fileName: "", fileData: "" },
  certifications: [{ name: "", fileName: "", fileData: "" }],
  yearsOfOperation: "",
  countrywideDelivery: false,
  countyCoverageEntries: [createCountyCoverageEntry("")],
  coverageMode: "",
  coverageDetails: "",
  productCategories: [],
  brandsRepresented: [""],
  socialMediaLinks: "",
  declaration: ""
};

const fieldToStep = {
  companyName: 0,
  contactPerson: 0,
  phoneNumber: 0,
  email: 0,
  physicalAddress: 0,
  website: 0,
  companyProfile: 0,
  businessRegNumber: 1,
  kraPin: 1,
  certifications: 1,
  yearsOfOperation: 1,
  countrywideDelivery: 2,
  countyCoverageEntries: 2,
  coverageMode: 2,
  coverageDetails: 2,
  productCategories: 3,
  brandsRepresented: 3,
  socialMediaLinks: 3,
  declaration: 3
};

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
  certifications: false,
  yearsOfOperation: true,
  countyCoverage: true,
  productCategories: true,
  brandsRepresented: false,
  socialMediaLinks: false,
  declaration: true
};

const storageKey = "kerea-marketplace-vendor-draft-v1";

const MarketplaceVendorForm = ({ onStepChange }) => {
  const navigate = useNavigate();
  const { palette } = useSiteSettings();
  const [formValues, setFormValues] = useState({ ...initialValues });
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldConfig, setFieldConfig] = useState({});

  useEffect(() => {
    getMarketplaceSettings()
      .then((data) => setFieldConfig(data.fieldConfig || {}))
      .catch(() => setFieldConfig({}));
  }, []);

  const productCategoryOptions = useMemo(
    () => (fieldConfig.categoryOptions?.length ? fieldConfig.categoryOptions : defaultProductCategoryOptions),
    [fieldConfig]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormValues({ ...initialValues, ...(parsed.formValues || {}) });
        if (typeof parsed.stepIndex === "number") {
          setStepIndex(parsed.stepIndex);
        }
      }
    } catch {
      // ignore corrupt draft
    }
  }, []);

  useEffect(() => {
    const saveDraft = () => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ formValues, stepIndex }));
        return;
      } catch {
        // storage may be full because of base64 file data; try again without the file content
      }

      const stripped = {
        ...formValues,
        kraPin: { ...formValues.kraPin, fileData: "" },
        certifications: formValues.certifications.map((cert) => ({ ...cert, fileData: "" }))
      };

      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ formValues: stripped, stepIndex, filesStripped: true }));
      } catch {
        // ignore if storage still fails
      }
    };

    saveDraft();
  }, [formValues, stepIndex]);

  const isRequired = (field) => {
    if (fieldConfig.required?.[field] !== undefined) return Boolean(fieldConfig.required[field]);
    if (fieldConfig[field] !== undefined) return Boolean(fieldConfig[field]);
    return defaultRequired[field];
  };

  const isVisible = (field) => fieldConfig.show?.[field] !== false;
  const showKraPinUpload = fieldConfig.showKraPinUpload !== false;
  const kraPinUploadRequired = fieldConfig.kraPinUploadRequired === true;
  const showBusinessRegUpload = fieldConfig.showBusinessRegUpload !== false;
  const businessRegUploadRequired = fieldConfig.businessRegUploadRequired === true;
  const showCertificationsUpload = fieldConfig.showCertificationsUpload !== false;
  const certificationsUploadRequired = fieldConfig.certificationsUploadRequired === true;

  const currentStep = steps[stepIndex].id;

  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  const updateField = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  };

  const updateCoverageEntries = (countyCoverageEntries) => {
    const completedEntries = countyCoverageEntries.filter((entry) => isCountyCoverageEntryComplete(entry));
    const firstCounty = countyCoverageEntries.find((entry) => entry.county)?.county || "";

    updateField("countyCoverageEntries", countyCoverageEntries);
    updateField("coverageMode", completedEntries.length ? deriveCoverageMode(completedEntries) : "");
    updateField("coverageDetails", buildCoverageSummary(countyCoverageEntries));
    updateField("county", firstCounty);
  };

  const validateAll = () => {
    const nextErrors = {};

    if (isVisible("companyName") && isRequired("companyName") && !formValues.companyName.trim()) nextErrors.companyName = "Company name is required.";
    if (isVisible("contactPerson") && isRequired("contactPerson") && !formValues.contactPerson.trim()) nextErrors.contactPerson = "Contact person is required.";

    const normalizedPhone = normalizePhone(formValues.phoneNumber);
    if (isVisible("phoneNumber")) {
      if (isRequired("phoneNumber") && !normalizedPhone) {
        nextErrors.phoneNumber = "Phone number is required.";
      } else if (normalizedPhone && !kenyanPhonePattern.test(normalizedPhone)) {
        nextErrors.phoneNumber = "Use a valid Kenyan number such as +254712345678.";
      }
    }

    const email = formValues.email.trim().toLowerCase();
    if (isVisible("email")) {
      if (isRequired("email") && !email) {
        nextErrors.email = "Email address is required.";
      } else if (email && !emailPattern.test(email)) {
        nextErrors.email = "Enter a valid email address.";
      }
    }

    if (isVisible("businessRegNumber") && isRequired("businessRegNumber") && !formValues.businessRegNumber.trim()) nextErrors.businessRegNumber = "Business registration number is required.";
    if (isVisible("businessRegNumber") && showBusinessRegUpload && businessRegUploadRequired && !formValues.businessRegDocument.fileName) {
      nextErrors.businessRegUpload = "Please upload the business registration document.";
    }
    if (isVisible("kraPin") && isRequired("kraPin") && !formValues.kraPin.number.trim()) {
      nextErrors.kraPin = "KRA PIN is required.";
    }
    if (isVisible("kraPin") && showKraPinUpload && kraPinUploadRequired && !formValues.kraPin.fileName) {
      nextErrors.kraPinUpload = "Please upload the KRA PIN certificate.";
    }

    if (isVisible("certifications") && isRequired("certifications")) {
      const certsNeedFile = showCertificationsUpload && certificationsUploadRequired;
      const validCerts = formValues.certifications.filter((cert) => cert.name.trim() && (!certsNeedFile || cert.fileName));
      if (!validCerts.length) {
        nextErrors.certifications = certsNeedFile ? "Add at least one certification with a name and upload." : "Add at least one certification name.";
      } else if (showCertificationsUpload && certificationsUploadRequired) {
        const missingFile = formValues.certifications.some((cert) => cert.name.trim() && !cert.fileName);
        if (missingFile) {
          nextErrors.certifications = "Each certification needs an uploaded file.";
        }
      }
    }

    if (isVisible("yearsOfOperation") && isRequired("yearsOfOperation") && !formValues.yearsOfOperation) nextErrors.yearsOfOperation = "Years of operation is required.";

    if (isVisible("countyCoverage") && isRequired("countyCoverage") && !formValues.countrywideDelivery) {
      const completedCountyCoverageEntries = formValues.countyCoverageEntries.filter((entry) => isCountyCoverageEntryComplete(entry));
      const hasStarted = formValues.countyCoverageEntries.some((entry) => entry.county);
      const hasIncomplete = formValues.countyCoverageEntries.some((entry) => entry.county && !isCountyCoverageEntryComplete(entry));

      if (!hasStarted) {
        nextErrors.county = "Select at least one county of operation.";
      }

      if (!completedCountyCoverageEntries.length || hasIncomplete) {
        nextErrors.coverageMode = "Complete the county coverage details.";
      }

      if (!formValues.coverageDetails.trim()) {
        nextErrors.coverageDetails = "Coverage details are required.";
      }
    }

    if (isVisible("productCategories") && isRequired("productCategories") && !formValues.productCategories.length) nextErrors.productCategories = "Select at least one product category.";
    if (isVisible("declaration") && isRequired("declaration") && formValues.declaration !== "Yes") nextErrors.declaration = "You must confirm the declaration.";

    return nextErrors;
  };

  const validateCurrentStep = () => {
    const allErrors = validateAll();
    const stepFields = {
      company: ["companyName", "contactPerson", "phoneNumber", "email", "physicalAddress", "website", "companyProfile"],
      verification: ["businessRegNumber", "businessRegUpload", "kraPin", "kraPinUpload", "certifications", "yearsOfOperation"],
      coverage: ["countrywideDelivery", "county", "coverageMode", "coverageDetails"],
      products: ["productCategories", "brandsRepresented", "socialMediaLinks", "declaration"],
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

  const goToStep = (index) => {
    setStepIndex(index);
    setServerError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }
    goToStep(stepIndex + 1);
  };

  const handleBack = () => {
    setServerError("");
    goToStep(stepIndex - 1);
  };

  const handleStepClick = (index) => {
    if (index > stepIndex) {
      if (!validateCurrentStep()) {
        return;
      }
    }
    goToStep(index);
  };

  const handleEditReviewItem = (field) => {
    const targetStep = fieldToStep[field];
    if (targetStep !== undefined) {
      goToStep(targetStep);
    }
  };

  const handleSubmit = async () => {
    const allErrors = validateAll();
    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      await submitMarketplaceVendor({
        companyName: formValues.companyName.trim(),
        contactPerson: formValues.contactPerson.trim(),
        phoneNumber: normalizePhone(formValues.phoneNumber),
        email: formValues.email.trim().toLowerCase(),
        physicalAddress: formValues.physicalAddress.trim(),
        website: formValues.website.trim(),
        companyProfile: formValues.companyProfile.trim(),
        businessRegNumber: formValues.businessRegNumber.trim(),
        businessRegDocument: formValues.businessRegDocument,
        kraPin: {
          number: formValues.kraPin.number.trim(),
          fileName: formValues.kraPin.fileName,
          fileData: formValues.kraPin.fileData
        },
        certifications: formValues.certifications
          .filter((cert) => cert.name.trim() && cert.fileName)
          .map((cert) => ({
            name: cert.name.trim(),
            fileName: cert.fileName,
            fileData: cert.fileData
          })),
        yearsOfOperation: formValues.yearsOfOperation,
        countrywideDelivery: formValues.countrywideDelivery,
        coverageMode: formValues.countrywideDelivery ? "countrywide" : formValues.coverageMode,
        coverageDetails: formValues.countrywideDelivery ? "Delivers countrywide in Kenya" : formValues.coverageDetails,
        coverageEntries: formValues.countrywideDelivery ? [] : formValues.countyCoverageEntries,
        productCategories: formValues.productCategories,
        brandsRepresented: formValues.brandsRepresented.filter((brand) => brand.trim()).join(", "),
        socialMediaLinks: formValues.socialMediaLinks.trim(),
        declaration: "Yes"
      });

      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }

      navigate("/success", {
        replace: true,
        state: {
          email: formValues.email.trim(),
          consent: true,
          source: "marketplace",
          title: "Thank you for joining the KEREA Marketplace",
          body: "Your information has been listed for review. We'll verify your details and publish your listing once approved.",
          homePath: "/marketplace",
          anotherPath: "/marketplace/apply"
        }
      });
    } catch (error) {
      if (error.data?.errors) {
        setErrors((current) => ({ ...current, ...error.data.errors }));
      }
      setServerError(error.message || "Unable to submit the form right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const reviewItems = useMemo(
    () => [
      { label: "Company Name", value: formValues.companyName, field: "companyName" },
      { label: "Contact Person", value: formValues.contactPerson, field: "contactPerson" },
      { label: "Phone Number", value: normalizePhone(formValues.phoneNumber), field: "phoneNumber" },
      { label: "Email", value: formValues.email, field: "email" },
      { label: "Physical Address", value: formValues.physicalAddress, field: "physicalAddress" },
      { label: "Website", value: formValues.website, field: "website" },
      { label: "Company Profile", value: formValues.companyProfile, field: "companyProfile" },
      { label: "Business Registration Number", value: formValues.businessRegNumber, field: "businessRegNumber" },
      { label: "Business Registration Document", value: formValues.businessRegDocument.fileName || "Not uploaded", field: "businessRegNumber" },
      { label: "KRA PIN", value: `${formValues.kraPin.number}${formValues.kraPin.fileName ? ` (${formValues.kraPin.fileName})` : ""}`, field: "kraPin" },
      { label: "Certifications", value: formValues.certifications.filter((cert) => cert.name.trim()).map((cert) => cert.name.trim()).join(", ") || "-", field: "certifications" },
      { label: "Years of Operation", value: formValues.yearsOfOperation, field: "yearsOfOperation" },
      { label: "Delivery Coverage", value: formValues.countrywideDelivery ? "Countrywide in Kenya" : formValues.coverageDetails, field: "countrywideDelivery" },
      { label: "Product Categories", value: formValues.productCategories.join(", "), field: "productCategories" },
      { label: "Brands Represented", value: formValues.brandsRepresented.filter((brand) => brand.trim()).join(", ") || "-", field: "brandsRepresented" },
      { label: "Social Media Links", value: formValues.socialMediaLinks, field: "socialMediaLinks" },
      { label: "Declaration", value: formValues.declaration, field: "declaration" }
    ],
    [formValues]
  );

  return (
    <div className="space-y-6">
      <Stepper steps={steps} currentIndex={stepIndex} palette={palette} onClick={handleStepClick} />

      <div className="rounded-[30px] border border-white/40 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
              Marketplace Vendor Onboarding
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {currentStep === "company" && "Company Information"}
              {currentStep === "verification" && "Business Verification"}
              {currentStep === "coverage" && "Delivery Coverage"}
              {currentStep === "products" && "Products & Online Presence"}
              {currentStep === "review" && "Review before you submit"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              {currentStep === "company" &&
                "Provide your company's basic information and primary contact details."}
              {currentStep === "verification" &&
                "The information collected here will be used to verify your business and support vendor onboarding."}
              {currentStep === "coverage" &&
                "Tell us where your business operates and where you can deliver products or services."}
              {currentStep === "products" &&
                "Help us understand the products and brands represented by your organization."}
              {currentStep === "review" &&
                "Please check the details below before sending them for review. Click the edit icon on any item to make a correction."}
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

        <div key={`step-${currentStep}`} className="min-h-[320px] space-y-5">
          {currentStep === "company" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <FloatingField
                  id="companyName"
                  label="Company Name"
                  value={formValues.companyName}
                  onChange={(event) => updateField("companyName", event.target.value)}
                  error={errors.companyName}
                  required={isRequired("companyName")}
                  hidden={!isVisible("companyName")}
                />
              </div>
              <FloatingField
                id="contactPerson"
                label="Contact Person"
                value={formValues.contactPerson}
                onChange={(event) => updateField("contactPerson", event.target.value)}
                error={errors.contactPerson}
                required={isRequired("contactPerson")}
                hidden={!isVisible("contactPerson")}
              />
              <FloatingField
                id="phoneNumber"
                label="Phone Number"
                value={formValues.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                error={errors.phoneNumber}
                helper="Accepted formats include 0712345678 or +254712345678."
                required={isRequired("phoneNumber")}
                hidden={!isVisible("phoneNumber")}
              />
              <FloatingField
                id="email"
                label="Email Address"
                type="email"
                value={formValues.email}
                onChange={(event) => updateField("email", event.target.value)}
                error={errors.email}
                required={isRequired("email")}
                hidden={!isVisible("email")}
              />
              <FloatingField
                id="physicalAddress"
                label="Physical Address"
                value={formValues.physicalAddress}
                onChange={(event) => updateField("physicalAddress", event.target.value)}
                error={errors.physicalAddress}
                hidden={!isVisible("physicalAddress")}
              />
              <div className="md:col-span-2">
                <FloatingField
                  id="website"
                  label="Website"
                  value={formValues.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  error={errors.website}
                  helper="If available, provide your company website URL."
                  hidden={!isVisible("website")}
                />
              </div>
              <div className="md:col-span-2">
                <FloatingField
                  id="companyProfile"
                  label="Company Profile"
                  as="textarea"
                  rows={5}
                  value={formValues.companyProfile}
                  onChange={(event) => updateField("companyProfile", event.target.value)}
                  error={errors.companyProfile}
                  helper="Provide a brief overview of your company, including your products, services, target market, and areas of operation."
                  required={isRequired("companyProfile")}
                  hidden={!isVisible("companyProfile")}
                />
              </div>
            </div>
          ) : null}

          {currentStep === "verification" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <FloatingField
                  id="businessRegNumber"
                  label="Business Registration Number"
                  value={formValues.businessRegNumber}
                  onChange={(event) => updateField("businessRegNumber", event.target.value)}
                  error={errors.businessRegNumber}
                  required={isRequired("businessRegNumber")}
                  hidden={!isVisible("businessRegNumber")}
                />
                {showBusinessRegUpload ? (
                  <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor }}>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={async (event) => {
                        const file = event.target.files[0];
                        if (!file) return;
                        const result = await readFile(file);
                        updateField("businessRegDocument", { fileName: result.fileName, fileData: result.fileData });
                      }}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium" style={{ color: palette.primary }}>
                      {formValues.businessRegDocument.fileName ? `Change file: ${formValues.businessRegDocument.fileName}` : "Upload business registration document"}
                    </span>
                  </label>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <FloatingField
                  id="kraPin"
                  label="KRA PIN"
                  value={formValues.kraPin.number}
                  onChange={(event) => updateField("kraPin", { ...formValues.kraPin, number: event.target.value })}
                  error={errors.kraPin}
                  required={isRequired("kraPin")}
                  hidden={!isVisible("kraPin")}
                />
                {showKraPinUpload ? (
                  <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.borderColor }}>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={async (event) => {
                        const file = event.target.files[0];
                        if (!file) return;
                        const result = await readFile(file);
                        updateField("kraPin", { ...formValues.kraPin, fileName: result.fileName, fileData: result.fileData });
                      }}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium" style={{ color: palette.primary }}>
                      {formValues.kraPin.fileName ? `Change file: ${formValues.kraPin.fileName}` : "Upload KRA PIN certificate"}
                    </span>
                  </label>
                ) : null}
              </div>
              {isVisible("certifications") ? (<div className="md:col-span-2 space-y-4">
                <div className="text-sm font-medium text-slate-700">Relevant Certifications</div>
                {formValues.certifications.map((cert, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_1fr_auto]" style={{ borderColor: palette.borderColor }}>
                    <FloatingField
                      id={`certName-${index}`}
                      label="Certificate Name"
                      value={cert.name}
                      onChange={(event) => {
                        const next = [...formValues.certifications];
                        next[index] = { ...cert, name: event.target.value };
                        updateField("certifications", next);
                      }}
                      error={index === 0 ? errors.certifications : undefined}
                      required={isRequired("certifications") && index === 0}
                    />
                    {showCertificationsUpload ? (
                      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border px-4" style={{ borderColor: palette.borderColor }}>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={async (event) => {
                            const file = event.target.files[0];
                            if (!file) return;
                            const result = await readFile(file);
                            const next = [...formValues.certifications];
                            next[index] = { ...cert, fileName: result.fileName, fileData: result.fileData };
                            updateField("certifications", next);
                          }}
                          className="sr-only"
                        />
                        <span className="truncate text-sm font-medium" style={{ color: palette.primary }}>
                          {cert.fileName || "Upload certificate"}
                        </span>
                      </label>
                    ) : null}
                    {formValues.certifications.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const next = formValues.certifications.filter((_, i) => i !== index);
                          updateField("certifications", next);
                        }}
                        className="rounded-2xl border px-3 text-sm font-medium"
                        style={{ borderColor: palette.borderColor, color: palette.textColor }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateField("certifications", [...formValues.certifications, { name: "", fileName: "", fileData: "" }])}
                  className="rounded-2xl border px-4 py-2 text-sm font-medium"
                  style={{ borderColor: palette.borderColor, color: palette.textColor }}
                >
                  + Add another certificate
                </button>
              </div>
              ) : null}
              {isVisible("yearsOfOperation") ? (<div className="md:col-span-2 space-y-3">
                <div className="text-sm font-medium text-slate-700">Years of Operation</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {yearsOptions.map((option) => (
                    <RadioCard
                      key={option}
                      title={option}
                      description=""
                      checked={formValues.yearsOfOperation === option}
                      onClick={() => updateField("yearsOfOperation", option)}
                      activeColor={palette.primary}
                      softColor={palette.primarySoft}
                      textColor={palette.primaryDeep}
                    />
                  ))}
                </div>
                {errors.yearsOfOperation ? <p className="text-sm text-rose-600">{errors.yearsOfOperation}</p> : null}
              </div>
              ) : null}
            </div>
          ) : null}

          {currentStep === "coverage" && isVisible("countyCoverage") ? (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700">Do you deliver countrywide in Kenya?</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <RadioCard
                    title="Yes, countrywide delivery"
                    description="We deliver products or services to all counties in Kenya."
                    checked={formValues.countrywideDelivery}
                    onClick={() => updateField("countrywideDelivery", true)}
                    activeColor={palette.primary}
                    softColor={palette.primarySoft}
                    textColor={palette.primaryDeep}
                  />
                  <RadioCard
                    title="Specific counties or regions"
                    description="Tell us exactly which counties, sub-counties, and wards you cover."
                    checked={!formValues.countrywideDelivery}
                    onClick={() => updateField("countrywideDelivery", false)}
                    activeColor={palette.primary}
                    softColor={palette.primarySoft}
                    textColor={palette.primaryDeep}
                  />
                </div>
              </div>

              {!formValues.countrywideDelivery ? (
                <CountyCoverageSelector
                  entries={formValues.countyCoverageEntries}
                  onChange={updateCoverageEntries}
                  errors={{
                    county: errors.county,
                    coverageMode: errors.coverageMode,
                    coverageDetails: errors.coverageDetails
                  }}
                />
              ) : null}
            </div>
          ) : null}

          {currentStep === "products" ? (
            <div className="grid gap-5 md:grid-cols-2">
              {isVisible("productCategories") ? (<div className="md:col-span-2 max-w-4xl">
                <MultiSelectDropdown
                  id="productCategories"
                  label="Product Categories"
                  options={productCategoryOptions}
                  values={formValues.productCategories}
                  onChange={(selection) => updateField("productCategories", selection)}
                  error={errors.productCategories}
                  placeholder="Select product categories"
                  enableSelectAll
                  showSelectedChips
                />
              </div>
              ) : null}
              {isVisible("brandsRepresented") ? (<div className="md:col-span-2 max-w-4xl space-y-3">
                <div className="text-sm font-medium text-slate-700">Brands Represented</div>
                {formValues.brandsRepresented.map((brand, index) => (
                  <div key={index} className="flex gap-3">
                    <FloatingField
                      id={`brand-${index}`}
                      label={`Brand ${index + 1}`}
                      value={brand}
                      onChange={(event) => {
                        const next = [...formValues.brandsRepresented];
                        next[index] = event.target.value;
                        updateField("brandsRepresented", next);
                      }}
                      error={index === 0 ? errors.brandsRepresented : undefined}
                      className="flex-1"
                    />
                    {formValues.brandsRepresented.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => updateField("brandsRepresented", formValues.brandsRepresented.filter((_, i) => i !== index))}
                        className="rounded-2xl border px-3 text-sm font-medium"
                        style={{ borderColor: palette.borderColor, color: palette.textColor }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateField("brandsRepresented", [...formValues.brandsRepresented, ""])}
                  className="rounded-2xl border px-4 py-2 text-sm font-medium"
                  style={{ borderColor: palette.borderColor, color: palette.textColor }}
                >
                  + Add another brand
                </button>
              </div>
              ) : null}
              <div className="md:col-span-2 max-w-4xl">
                <FloatingField
                  id="socialMediaLinks"
                  label="Social Media Links"
                  style={{ backgroundColor: "#ffffff" }}
                  value={formValues.socialMediaLinks}
                  onChange={(event) => updateField("socialMediaLinks", event.target.value)}
                  error={errors.socialMediaLinks}
                  helper="Provide links to your social media pages if available."
                  hidden={!isVisible("socialMediaLinks")}
                />
              </div>
              {isVisible("declaration") ? (<div className="md:col-span-2 space-y-3">
                <div className="text-sm font-medium text-slate-700">Declaration</div>
                <RadioCard
                  title="I confirm that the information provided in this form is accurate and complete to the best of my knowledge."
                  description=""
                  checked={formValues.declaration === "Yes"}
                  onClick={() => updateField("declaration", "Yes")}
                  activeColor={palette.primary}
                  softColor={palette.primarySoft}
                  textColor={palette.primaryDeep}
                />
                {errors.declaration ? <p className="text-sm text-rose-600">{errors.declaration}</p> : null}
              </div>
              ) : null}
            </div>
          ) : null}

          {currentStep === "review" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {reviewItems.map((item) => (
                <div
                  key={item.label}
                  className="relative rounded-2xl border-2 border-slate-300 bg-slate-50 p-4"
                >
                  <button
                    type="button"
                    onClick={() => handleEditReviewItem(item.field)}
                    className="absolute right-3 top-3 rounded-xl px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: palette.primary }}
                  >
                    Edit
                  </button>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 pr-16">{item.label}</div>
                  <div className="mt-2 break-words text-sm text-slate-800">{item.value || "Not provided"}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {serverError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="rounded-2xl border px-6 py-3 text-sm font-semibold transition disabled:opacity-50"
              style={{ borderColor: palette.borderColor, color: palette.textColor }}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {stepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: palette.primary }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: palette.primary }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceVendorForm;
