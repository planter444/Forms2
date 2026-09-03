import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import { submitMarketplaceVendor } from "../lib/api.js";

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
  ...props
}) => {
  const { palette } = useSiteSettings();
  const classes = `border-2 peer w-full rounded-2xl px-4 pb-3 pt-6 text-sm shadow-sm outline-none transition placeholder:text-transparent focus:ring-4 sm:text-base ${
    error ? "focus:ring-rose-100" : "focus:ring-slate-100"
  }`;
  const labelClass =
    "pointer-events-none absolute left-4 right-4 top-2 text-[11px] font-medium leading-tight transition peer-placeholder-shown:top-3 peer-placeholder-shown:text-[12px] peer-focus:top-2 peer-focus:text-[11px] sm:text-xs sm:peer-placeholder-shown:top-4 sm:peer-placeholder-shown:text-base sm:peer-focus:top-2 sm:peer-focus:text-xs";

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
              borderColor: error ? "#f43f5e" : "#94a3b8"
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
              borderColor: error ? "#f43f5e" : "#94a3b8"
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

const Stepper = ({ steps, currentIndex, palette }) => (
  <div className={`grid grid-cols-2 gap-3 ${steps.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
    {steps.map((step, index) => {
      const active = index === currentIndex;
      const complete = index < currentIndex;

      return (
        <div
          key={step.id}
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
        </div>
      );
    })}
  </div>
);

const steps = [
  { id: "company", title: "Company" },
  { id: "verification", title: "Verification" },
  { id: "products", title: "Products" },
  { id: "review", title: "Review" }
];

const yearsOptions = ["Less than 1 Year", "1 – 3 Years", "4 – 7 Years", "8 – 10 Years", "More than 10 Years"];

const productCategoryOptions = [
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
  county: "",
  website: "",
  companyProfile: "",
  businessRegNumber: "",
  kraPin: "",
  certifications: "",
  yearsOfOperation: "",
  productCategories: [],
  brandsRepresented: "",
  socialMediaLinks: "",
  declaration: ""
};

const MarketplaceVendorForm = () => {
  const navigate = useNavigate();
  const { palette } = useSiteSettings();
  const [formValues, setFormValues] = useState({ ...initialValues });
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentStep = steps[stepIndex].id;

  const updateField = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  };

  const validateAll = () => {
    const nextErrors = {};

    if (!formValues.companyName.trim()) nextErrors.companyName = "Company name is required.";
    if (!formValues.contactPerson.trim()) nextErrors.contactPerson = "Contact person is required.";

    const normalizedPhone = normalizePhone(formValues.phoneNumber);
    if (!normalizedPhone) {
      nextErrors.phoneNumber = "Phone number is required.";
    } else if (!kenyanPhonePattern.test(normalizedPhone)) {
      nextErrors.phoneNumber = "Use a valid Kenyan number such as +254712345678.";
    }

    const emailError = getEmailError(formValues.email);
    if (emailError) nextErrors.email = emailError;

    if (!formValues.businessRegNumber.trim()) nextErrors.businessRegNumber = "Business registration number is required.";
    if (!formValues.kraPin.trim()) nextErrors.kraPin = "KRA PIN is required.";
    if (!formValues.certifications.trim()) nextErrors.certifications = "Certifications are required.";
    if (!formValues.yearsOfOperation) nextErrors.yearsOfOperation = "Years of operation is required.";
    if (!formValues.productCategories.length) nextErrors.productCategories = "Select at least one product category.";
    if (formValues.declaration !== "Yes") nextErrors.declaration = "You must confirm the declaration.";

    return nextErrors;
  };

  const validateCurrentStep = () => {
    const allErrors = validateAll();
    const stepFields = {
      company: ["companyName", "contactPerson", "phoneNumber", "email", "physicalAddress", "county", "website", "companyProfile"],
      verification: ["businessRegNumber", "kraPin", "certifications", "yearsOfOperation"],
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

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setServerError("");
    setStepIndex((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        county: formValues.county.trim(),
        website: formValues.website.trim(),
        companyProfile: formValues.companyProfile.trim(),
        businessRegNumber: formValues.businessRegNumber.trim(),
        kraPin: formValues.kraPin.trim(),
        certifications: formValues.certifications.trim(),
        yearsOfOperation: formValues.yearsOfOperation,
        productCategories: formValues.productCategories,
        brandsRepresented: formValues.brandsRepresented.trim(),
        socialMediaLinks: formValues.socialMediaLinks.trim(),
        declaration: "Yes"
      });

      navigate("/success", {
        replace: true,
        state: {
          email: formValues.email.trim(),
          consent: true
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
      { label: "Company Name", value: formValues.companyName },
      { label: "Contact Person", value: formValues.contactPerson },
      { label: "Phone Number", value: normalizePhone(formValues.phoneNumber) },
      { label: "Email", value: formValues.email },
      { label: "Physical Address", value: formValues.physicalAddress },
      { label: "County", value: formValues.county },
      { label: "Website", value: formValues.website },
      { label: "Company Profile", value: formValues.companyProfile },
      { label: "Business Registration Number", value: formValues.businessRegNumber },
      { label: "KRA PIN", value: formValues.kraPin },
      { label: "Certifications", value: formValues.certifications },
      { label: "Years of Operation", value: formValues.yearsOfOperation },
      { label: "Product Categories", value: formValues.productCategories.join(", ") },
      { label: "Brands Represented", value: formValues.brandsRepresented },
      { label: "Social Media Links", value: formValues.socialMediaLinks },
      { label: "Declaration", value: formValues.declaration }
    ],
    [formValues]
  );

  return (
    <div className="space-y-6">
      <Stepper steps={steps} currentIndex={stepIndex} palette={palette} />

      <div className="rounded-[30px] border border-white/40 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.primary }}>
              Marketplace Vendor Onboarding
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {currentStep === "company" && "Company Information"}
              {currentStep === "verification" && "Business Verification"}
              {currentStep === "products" && "Products & Online Presence"}
              {currentStep === "review" && "Review before you submit"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              {currentStep === "company" &&
                "Provide your company's basic information and primary contact details."}
              {currentStep === "verification" &&
                "The information collected here will be used to verify your business and support vendor onboarding."}
              {currentStep === "products" &&
                "Help us understand the products and brands represented by your organization."}
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
                  required
                  palette={palette}
                />
              </div>
              <FloatingField
                id="contactPerson"
                label="Contact Person"
                value={formValues.contactPerson}
                onChange={(event) => updateField("contactPerson", event.target.value)}
                error={errors.contactPerson}
                required
                palette={palette}
              />
              <FloatingField
                id="phoneNumber"
                label="Phone Number"
                value={formValues.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                error={errors.phoneNumber}
                helper="Accepted formats include 0712345678 or +254712345678."
                required
                palette={palette}
              />
              <FloatingField
                id="email"
                label="Email Address"
                type="email"
                value={formValues.email}
                onChange={(event) => updateField("email", event.target.value)}
                error={errors.email}
                required
                palette={palette}
              />
              <FloatingField
                id="physicalAddress"
                label="Physical Address"
                value={formValues.physicalAddress}
                onChange={(event) => updateField("physicalAddress", event.target.value)}
                error={errors.physicalAddress}
                palette={palette}
              />
              <FloatingField
                id="county"
                label="County"
                value={formValues.county}
                onChange={(event) => updateField("county", event.target.value)}
                error={errors.county}
                palette={palette}
              />
              <div className="md:col-span-2">
                <FloatingField
                  id="website"
                  label="Website"
                  value={formValues.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  error={errors.website}
                  helper="If available, provide your company website URL."
                  palette={palette}
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
                  required
                  palette={palette}
                />
              </div>
            </div>
          ) : null}

          {currentStep === "verification" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <FloatingField
                id="businessRegNumber"
                label="Business Registration Number"
                value={formValues.businessRegNumber}
                onChange={(event) => updateField("businessRegNumber", event.target.value)}
                error={errors.businessRegNumber}
                required
                palette={palette}
              />
              <FloatingField
                id="kraPin"
                label="KRA PIN"
                value={formValues.kraPin}
                onChange={(event) => updateField("kraPin", event.target.value)}
                error={errors.kraPin}
                required
                palette={palette}
              />
              <div className="md:col-span-2">
                <FloatingField
                  id="certifications"
                  label="Relevant Certifications"
                  value={formValues.certifications}
                  onChange={(event) => updateField("certifications", event.target.value)}
                  error={errors.certifications}
                  helper="Please list any certifications, licenses, permits, or accreditations relevant to your business and products."
                  required
                  palette={palette}
                />
              </div>
              <div className="md:col-span-2 space-y-3">
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
            </div>
          ) : null}

          {currentStep === "products" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
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
              <FloatingField
                id="brandsRepresented"
                label="Brands Represented"
                value={formValues.brandsRepresented}
                onChange={(event) => updateField("brandsRepresented", event.target.value)}
                error={errors.brandsRepresented}
                helper="List the brands, manufacturers, or product lines represented by your organization."
                palette={palette}
              />
              <FloatingField
                id="socialMediaLinks"
                label="Social Media Links"
                value={formValues.socialMediaLinks}
                onChange={(event) => updateField("socialMediaLinks", event.target.value)}
                error={errors.socialMediaLinks}
                helper="Provide links to your social media pages if available."
                palette={palette}
              />
              <div className="md:col-span-2 space-y-3">
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
            </div>
          ) : null}

          {currentStep === "review" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {reviewItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">{item.label}</div>
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
