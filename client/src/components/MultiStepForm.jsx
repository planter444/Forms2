import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchableSelect from "./SearchableSelect.jsx";
import { categories, counties } from "../data/formOptions.js";
import { submitListing } from "../lib/api.js";

const initialValues = {
  email: "",
  consent: null,
  fullName: "",
  phoneNumber: "",
  category: "",
  licenseNumber: "",
  county: "",
  declineReason: ""
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const kenyanPhonePattern = /^\+254[17]\d{8}$/;

const normalizePhone = (value) => {
  const raw = `${value || ""}`.trim().replace(/[\s()-]/g, "");

  if (!raw) {
    return "";
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
  ...props
}) => {
  const classes = `peer w-full rounded-2xl border bg-white px-4 pb-3 pt-6 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-transparent focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${
    error ? "border-rose-300" : "border-slate-200"
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
            className={`${classes} resize-none`}
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
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
            {...props}
          />
        )}
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500 transition peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-brand-700"
        >
          {label}
        </label>
      </div>
      {helper ? (
        <p id={`${id}-helper`} className="text-sm text-slate-500">
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

const RadioCard = ({ title, description, checked, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border p-4 text-left transition ${
      checked
        ? "border-brand-500 bg-brand-50 shadow-sm"
        : "border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`mt-1 h-5 w-5 rounded-full border-2 ${
          checked ? "border-brand-600 bg-brand-600 ring-4 ring-brand-100" : "border-slate-300"
        }`}
      />
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  </button>
);

const Stepper = ({ steps, currentIndex }) => (
  <div className="grid gap-3 sm:grid-cols-4">
    {steps.map((step, index) => {
      const active = index === currentIndex;
      const complete = index < currentIndex;

      return (
        <div
          key={step.id}
          className={`rounded-2xl border px-4 py-3 transition ${
            active
              ? "border-brand-500 bg-brand-50"
              : complete
                ? "border-brand-200 bg-white"
                : "border-slate-200 bg-white"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Step {index + 1}
          </div>
          <div className={`mt-1 font-medium ${active ? "text-brand-800" : "text-slate-800"}`}>
            {step.title}
          </div>
        </div>
      );
    })}
  </div>
);

const SummaryItem = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {label}
    </div>
    <div className="mt-2 text-sm text-slate-800">{value || "Not provided"}</div>
  </div>
);

const MultiStepForm = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(initialValues);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(() => getSteps(formValues.consent), [formValues.consent]);
  const currentStep = steps[stepIndex]?.id || "consent";

  const updateField = (field, value) => {
    setFormValues((current) => {
      const next = { ...current, [field]: value };

      if (field === "consent" && value === false) {
        next.fullName = "";
        next.phoneNumber = "";
        next.category = "";
        next.licenseNumber = "";
        next.county = "";
      }

      if (field === "consent" && value === true) {
        next.declineReason = "";
      }

      return next;
    });

    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  };

  const validateAll = () => {
    const nextErrors = {};
    const normalizedPhone = normalizePhone(formValues.phoneNumber);

    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailPattern.test(formValues.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
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

      if (!formValues.category) {
        nextErrors.category = "Select your stakeholder category.";
      }

      if (!formValues.county) {
        nextErrors.county = "Select your county of operation.";
      }
    }

    return nextErrors;
  };

  const validateCurrentStep = () => {
    const allErrors = validateAll();
    const stepFields = {
      consent: ["email", "consent"],
      details: ["fullName", "phoneNumber", "category"],
      location: ["county"],
      decline: [],
      review: Object.keys(allErrors)
    };

    const relevantErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([field]) => stepFields[currentStep].includes(field))
    );

    setErrors((current) => ({ ...current, ...relevantErrors }));
    return Object.keys(relevantErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleBack = () => {
    setServerError("");
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    const nextErrors = validateAll();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      await submitListing({
        ...formValues,
        email: formValues.email.trim().toLowerCase(),
        phoneNumber: normalizePhone(formValues.phoneNumber)
      });

      navigate("/success", {
        replace: true,
        state: {
          email: formValues.email.trim(),
          consent: formValues.consent
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

  const isReviewValid = Object.keys(validateAll()).length === 0;

  return (
    <div className="space-y-6">
      <Stepper steps={steps} currentIndex={stepIndex} />

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
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
                "Select the county where you primarily serve customers or operate professionally."}
              {currentStep === "decline" &&
                "Optional, but helpful if your organization may want to participate later."}
              {currentStep === "review" &&
                "Please check the details below before sending them for review."}
            </p>
          </div>
          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Progress
            </div>
            <div className="mt-1 text-sm font-medium text-brand-900">
              {stepIndex + 1} of {steps.length}
            </div>
          </div>
        </div>

        <div className="min-h-[320px] animate-fade-in animate-slide-up">
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
                  />
                  <RadioCard
                    title="No, I prefer not to be listed"
                    description="You can still leave a short note to help us understand your decision."
                    checked={formValues.consent === false}
                    onClick={() => updateField("consent", false)}
                  />
                </div>
                {errors.consent ? (
                  <p className="text-sm text-rose-600">{errors.consent}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {currentStep === "details" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <FloatingField
                  id="fullName"
                  label="Full name"
                  value={formValues.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  error={errors.fullName}
                  autoComplete="name"
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
              />
              <SearchableSelect
                id="category"
                label="Category"
                value={formValues.category}
                onChange={(option) => updateField("category", option)}
                options={categories}
                error={errors.category}
                helper="Choose the role clients would search for."
                placeholder="Search categories"
              />
              <div className="md:col-span-2">
                <FloatingField
                  id="licenseNumber"
                  label="EPRA / relevant professional license number"
                  value={formValues.licenseNumber}
                  onChange={(event) => updateField("licenseNumber", event.target.value)}
                  helper="Optional, but it strengthens trust in your listing."
                />
              </div>
            </div>
          ) : null}

          {currentStep === "location" ? (
            <div className="space-y-5">
              <SearchableSelect
                id="county"
                label="County of operation"
                value={formValues.county}
                onChange={(option) => updateField("county", option)}
                options={counties}
                error={errors.county}
                helper="Search from all 47 Kenyan counties."
                placeholder="Start typing your county"
              />
              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
                Your county helps KEREA present regionally relevant options to users on the USSD platform.
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
              />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                You can always return later if you decide to participate in the listing.
              </div>
            </div>
          ) : null}

          {currentStep === "review" ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <SummaryItem label="Email" value={formValues.email} />
                <SummaryItem
                  label="Consent"
                  value={formValues.consent ? "Yes, happy to be listed" : "No, prefer not to be listed"}
                />
                {formValues.consent ? (
                  <>
                    <SummaryItem label="Full name" value={formValues.fullName} />
                    <SummaryItem label="Phone number" value={normalizePhone(formValues.phoneNumber)} />
                    <SummaryItem label="Category" value={formValues.category} />
                    <SummaryItem label="License number" value={formValues.licenseNumber} />
                    <SummaryItem label="County" value={formValues.county} />
                  </>
                ) : (
                  <SummaryItem label="Decline reason" value={formValues.declineReason} />
                )}
              </div>
              {!isReviewValid ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Please go back and complete the required fields before submitting.
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

        <div className="sticky bottom-4 mt-8 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0 || submitting}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            {currentStep === "review" ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isReviewValid || submitting}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Submitting..." : "Submit listing request"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Next step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;
