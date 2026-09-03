import { categories, counties } from "./constants.js";

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
const validCoverageModes = [
  "all_wards_in_county",
  "specific_areas",
  "multiple_counties"
];

const cleanText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
};

const normalizeCategorySelection = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => cleanText(item)).filter(Boolean))];
  }

  if (typeof value === "string") {
    return value
      .split("|")
      .map((item) => cleanText(item))
      .filter(Boolean);
  }

  return [];
};

export const sanitizeSubmissionInput = (payload = {}) => {
  const email = cleanText(payload.email).toLowerCase();
  const fullName = cleanText(payload.fullName);
  const phoneNumber = normalizeKenyanPhone(payload.phoneNumber);
  const categories = normalizeCategorySelection(payload.categories?.length ? payload.categories : payload.category);
  const category = categories.join(" | ");
  const licenseNumber = cleanText(payload.licenseNumber);
  const licenseBody = cleanText(payload.licenseBody);
  const county = cleanText(payload.county);
  const coverageMode = cleanText(payload.coverageMode);
  const coverageDetails = cleanText(payload.coverageDetails);
  const declineReason = cleanText(payload.declineReason);
  const consent =
    payload.consent === true || payload.consent === "true"
      ? true
      : payload.consent === false || payload.consent === "false"
        ? false
        : null;

  return {
    email,
    consent,
    fullName,
    phoneNumber,
    category,
    categories,
    licenseNumber,
    licenseBody,
    county,
    coverageMode,
    coverageDetails,
    declineReason
  };
};

export const normalizeKenyanPhone = (value) => {
  const raw = cleanText(value).replace(/[\s-()]/g, "");

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

export const validateSubmission = (input) => {
  const errors = {};

  if (!input.email) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(input.email)) {
    errors.email = "Enter a valid email address.";
  } else if (gmailTypoDomains.has(input.email.split("@")[1] || "")) {
    errors.email = "Did you mean @gmail.com? Please correct the email address.";
  }

  if (typeof input.consent !== "boolean") {
    errors.consent = "Consent selection is required.";
  }

  if (input.consent) {
    if (!input.fullName) {
      errors.fullName = "Full name is required.";
    }

    if (!input.phoneNumber) {
      errors.phoneNumber = "Phone number is required.";
    } else if (!kenyanPhonePattern.test(input.phoneNumber)) {
      errors.phoneNumber = "Enter a valid Kenyan phone number.";
    }

    if (!input.categories?.length) {
      errors.category = "At least one category is required.";
    } else if (input.categories.some((category) => !categories.includes(category))) {
      errors.category = "Select valid categories.";
    }

    if (!input.county) {
      errors.county = "County is required.";
    }

    if (!input.coverageMode) {
      errors.coverageMode = "Coverage selection is required.";
    } else if (!validCoverageModes.includes(input.coverageMode)) {
      errors.coverageMode = "Select a valid coverage option.";
    }

    if (
      (input.coverageMode === "specific_areas" || input.coverageMode === "multiple_counties") &&
      !input.coverageDetails
    ) {
      errors.coverageDetails = "Coverage details are required for the selected option.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const escapeCsvValue = (value) => {
  const text = `${value ?? ""}`.replace(/"/g, '""');
  return `"${text}"`;
};
