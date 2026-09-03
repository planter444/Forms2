import crypto from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import { databaseState, markDatabaseUnavailable, pool } from "./db.js";
import { requireAdmin } from "./auth.js";
import { escapeCsvValue } from "./validators.js";

const router = express.Router();

const requireDatabase = async (response) => {
  if (!databaseState.ready) {
    try {
      await pool.query("SELECT 1");
      databaseState.ready = true;
      databaseState.lastError = "";
    } catch (error) {
      console.error("Database recovery ping failed", error);
      markDatabaseUnavailable(error);
      response.status(503).json({
        message: "Database is not available right now.",
        detail: databaseState.lastError
      });
      return false;
    }
  }

  return true;
};

const marketplaceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many submissions from this connection. Please try again later."
  }
});

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => `${item || ""}`.trim()).filter(Boolean))];
  }

  if (typeof value === "string") {
    return value
      .split(/,|\n/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const defaultRequired = {
  companyName: true,
  contactPerson: true,
  phoneNumber: true,
  email: true,
  businessRegNumber: true,
  kraPin: true,
  yearsOfOperation: true,
  countyCoverage: true,
  productCategories: true,
  declaration: true,
  certifications: false,
  brandsRepresented: false,
  socialMediaLinks: false,
  website: false,
  physicalAddress: false,
  companyProfile: true
};

const isFieldRequired = (field, fieldConfig) => {
  if (fieldConfig?.required?.[field] !== undefined) return Boolean(fieldConfig.required[field]);
  if (fieldConfig?.[field] !== undefined) return Boolean(fieldConfig[field]);
  return defaultRequired[field] ?? false;
};

const isFieldVisible = (field, fieldConfig) => fieldConfig?.show?.[field] !== false;

const validatePayload = (payload, fieldConfig = {}) => {
  const errors = {};

  if (isFieldVisible("companyName", fieldConfig) && isFieldRequired("companyName", fieldConfig) && !`${payload.companyName || ""}`.trim()) {
    errors.companyName = "Company name is required.";
  }

  if (isFieldVisible("contactPerson", fieldConfig) && isFieldRequired("contactPerson", fieldConfig) && !`${payload.contactPerson || ""}`.trim()) {
    errors.contactPerson = "Contact person is required.";
  }

  if (isFieldVisible("phoneNumber", fieldConfig) && isFieldRequired("phoneNumber", fieldConfig) && !`${payload.phoneNumber || ""}`.trim()) {
    errors.phoneNumber = "Phone number is required.";
  }

  if (isFieldVisible("email", fieldConfig)) {
    if (isFieldRequired("email", fieldConfig) && !`${payload.email || ""}`.trim()) {
      errors.email = "Email address is required.";
    } else if (`${payload.email || ""}`.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.email = "Enter a valid email address.";
    }
  }

  if (isFieldVisible("businessRegNumber", fieldConfig) && isFieldRequired("businessRegNumber", fieldConfig) && !`${payload.businessRegNumber || ""}`.trim()) {
    errors.businessRegNumber = "Business registration number is required.";
  }

  const businessRegDocument = payload.businessRegDocument || {};
  if (isFieldVisible("businessRegNumber", fieldConfig) && fieldConfig.showBusinessRegUpload !== false && fieldConfig.businessRegUploadRequired === true && !`${businessRegDocument.fileName || ""}`.trim()) {
    errors.businessRegUpload = "Please upload the business registration document.";
  }

  const kraPin = payload.kraPin || {};
  if (isFieldVisible("kraPin", fieldConfig) && isFieldRequired("kraPin", fieldConfig) && !`${kraPin.number || ""}`.trim()) {
    errors.kraPin = "KRA PIN is required.";
  }

  if (isFieldVisible("kraPin", fieldConfig) && fieldConfig.showKraPinUpload !== false && fieldConfig.kraPinUploadRequired === true && !`${kraPin.fileName || ""}`.trim()) {
    errors.kraPin = "Please upload the KRA PIN certificate.";
  }

  if (isFieldVisible("yearsOfOperation", fieldConfig) && isFieldRequired("yearsOfOperation", fieldConfig) && !`${payload.yearsOfOperation || ""}`.trim()) {
    errors.yearsOfOperation = "Years of operation is required.";
  }

  const productCategories = normalizeArray(payload.productCategories);
  if (isFieldVisible("productCategories", fieldConfig) && isFieldRequired("productCategories", fieldConfig) && !productCategories.length) {
    errors.productCategories = "Select at least one product category.";
  }

  const coverageEntries = Array.isArray(payload.coverageEntries) ? payload.coverageEntries.filter((entry) => entry?.county) : [];

  if (isFieldVisible("countyCoverage", fieldConfig) && isFieldRequired("countyCoverage", fieldConfig) && payload.coverageMode !== "countrywide") {
    if (!coverageEntries.length) {
      errors.county = "Select at least one county of operation.";
    }

    if (!coverageEntries.some((entry) => entry.county && entry.subCountyMode)) {
      errors.coverageMode = "Complete the coverage details for each county.";
    }

    if (!`${payload.coverageDetails || ""}`.trim()) {
      errors.coverageDetails = "Coverage details are required.";
    }
  }

  if (isFieldVisible("declaration", fieldConfig) && isFieldRequired("declaration", fieldConfig) && payload.declaration !== "Yes" && payload.declaration !== true) {
    errors.declaration = "You must confirm the declaration.";
  }

  return { errors, productCategories, coverageEntries };
};

const mapRow = (row) => ({
  id: row.id,
  companyName: row.company_name,
  contactPerson: row.contact_person,
  phoneNumber: row.phone_number,
  email: row.email,
  physicalAddress: row.physical_address,
  county: row.county,
  coverageMode: row.coverage_mode,
  coverageDetails: row.coverage_details,
  coverageEntries: row.coverage_entries,
  website: row.website,
  companyProfile: row.company_profile,
  businessRegNumber: row.business_reg_number,
  businessRegDocument: row.business_reg_document,
  kraPin: row.kra_pin,
  certifications: row.certifications,
  yearsOfOperation: row.years_of_operation,
  productCategories: row.product_categories,
  brandsRepresented: row.brands_represented,
  socialMediaLinks: row.social_media_links,
  declaration: row.declaration,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

router.post("/submissions", marketplaceLimiter, async (request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  let fieldConfig = {};
  try {
    const settingsResult = await pool.query("SELECT field_config FROM marketplace_settings WHERE id = 'default'");
    fieldConfig = settingsResult.rows[0]?.field_config || {};
  } catch {
    fieldConfig = {};
  }

  const payload = request.body || {};
  const { errors, productCategories, coverageEntries } = validatePayload(payload, fieldConfig);

  if (Object.keys(errors).length > 0) {
    return response.status(400).json({ message: "Validation failed.", errors });
  }

  try {
    const id = crypto.randomUUID();
    const now = new Date();

    await pool.query(
      `
        INSERT INTO marketplace_vendor_submissions (
          id, company_name, contact_person, phone_number, email,
          physical_address, county, coverage_mode, coverage_details, coverage_entries,
          website, company_profile,
          business_reg_number, business_reg_document, kra_pin, certifications, years_of_operation,
          product_categories, brands_represented, social_media_links,
          declaration, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, $17, $18::text[], $19, $20, $21, $22, $23)
      `,
      [
        id,
        payload.companyName.trim(),
        payload.contactPerson.trim(),
        payload.phoneNumber.trim(),
        payload.email.trim().toLowerCase(),
        `${payload.physicalAddress || ""}`.trim(),
        coverageEntries[0]?.county || "",
        payload.coverageMode || "",
        `${payload.coverageDetails || ""}`.trim(),
        JSON.stringify(coverageEntries || []),
        `${payload.website || ""}`.trim(),
        `${payload.companyProfile || ""}`.trim(),
        payload.businessRegNumber.trim(),
        JSON.stringify(payload.businessRegDocument || {}),
        JSON.stringify(payload.kraPin || {}),
        JSON.stringify(payload.certifications || []),
        payload.yearsOfOperation,
        productCategories,
        `${payload.brandsRepresented || ""}`.trim(),
        `${payload.socialMediaLinks || ""}`.trim(),
        "Yes",
        now,
        now
      ]
    );

    response.status(201).json({ success: true, id });
  } catch (error) {
    console.error("Marketplace submission failed", error);
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to submit the form." });
  }
});

router.get("/submissions", requireAdmin, async (_request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  try {
    const result = await pool.query(
      `
        SELECT id, company_name, contact_person, phone_number, email,
               physical_address, county, coverage_mode, coverage_details, coverage_entries,
               website, company_profile,
               business_reg_number, business_reg_document, kra_pin, certifications, years_of_operation,
               product_categories, brands_represented, social_media_links,
               declaration, created_at, updated_at
        FROM marketplace_vendor_submissions
        ORDER BY created_at DESC
      `
    );

    response.json({ submissions: result.rows.map(mapRow) });
  } catch (error) {
    console.error("Marketplace submissions fetch failed", error);
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to fetch submissions." });
  }
});

router.get("/submissions/:id", requireAdmin, async (request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  try {
    const result = await pool.query(
      `
        SELECT id, company_name, contact_person, phone_number, email,
               physical_address, county, coverage_mode, coverage_details, coverage_entries,
               website, company_profile,
               business_reg_number, business_reg_document, kra_pin, certifications, years_of_operation,
               product_categories, brands_represented, social_media_links,
               declaration, created_at, updated_at
        FROM marketplace_vendor_submissions
        WHERE id = $1
      `,
      [request.params.id]
    );

    if (!result.rowCount) {
      return response.status(404).json({ message: "Submission not found." });
    }

    response.json({ submission: mapRow(result.rows[0]) });
  } catch (error) {
    console.error("Marketplace submission fetch failed", error);
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to fetch submission." });
  }
});

router.put("/submissions/:id", requireAdmin, async (request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  let fieldConfig = {};
  try {
    const settingsResult = await pool.query("SELECT field_config FROM marketplace_settings WHERE id = 'default'");
    fieldConfig = settingsResult.rows[0]?.field_config || {};
  } catch {
    fieldConfig = {};
  }

  const payload = request.body || {};
  const { errors, productCategories, coverageEntries } = validatePayload(payload, fieldConfig);

  if (Object.keys(errors).length > 0) {
    return response.status(400).json({ message: "Validation failed.", errors });
  }

  try {
    const result = await pool.query(
      `
        UPDATE marketplace_vendor_submissions
        SET company_name = $2,
            contact_person = $3,
            phone_number = $4,
            email = $5,
            physical_address = $6,
            county = $7,
            coverage_mode = $8,
            coverage_details = $9,
            coverage_entries = $10::jsonb,
            website = $11,
            company_profile = $12,
            business_reg_number = $13,
            business_reg_document = $14::jsonb,
            kra_pin = $15::jsonb,
            certifications = $16::jsonb,
            years_of_operation = $17,
            product_categories = $18::text[],
            brands_represented = $19,
            social_media_links = $20,
            declaration = $21,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [
        request.params.id,
        payload.companyName.trim(),
        payload.contactPerson.trim(),
        payload.phoneNumber.trim(),
        payload.email.trim().toLowerCase(),
        `${payload.physicalAddress || ""}`.trim(),
        coverageEntries[0]?.county || "",
        payload.coverageMode || "",
        `${payload.coverageDetails || ""}`.trim(),
        JSON.stringify(coverageEntries || []),
        `${payload.website || ""}`.trim(),
        `${payload.companyProfile || ""}`.trim(),
        payload.businessRegNumber.trim(),
        JSON.stringify(payload.businessRegDocument || {}),
        JSON.stringify(payload.kraPin || {}),
        JSON.stringify(payload.certifications || []),
        payload.yearsOfOperation,
        productCategories,
        `${payload.brandsRepresented || ""}`.trim(),
        `${payload.socialMediaLinks || ""}`.trim(),
        "Yes"
      ]
    );

    if (!result.rowCount) {
      return response.status(404).json({ message: "Submission not found." });
    }

    response.json({ submission: mapRow(result.rows[0]) });
  } catch (error) {
    console.error("Marketplace submission update failed", error);
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to update submission." });
  }
});

router.delete("/submissions/:id", requireAdmin, async (request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM marketplace_vendor_submissions WHERE id = $1 RETURNING id",
      [request.params.id]
    );

    if (!result.rows.length) {
      return response.status(404).json({ message: "Submission not found." });
    }

    response.json({ success: true });
  } catch (error) {
    console.error("Marketplace submission delete failed", error);
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to delete submission." });
  }
});

router.get("/submissions/export", requireAdmin, async (_request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  try {
    const result = await pool.query(
      `
        SELECT id, company_name, contact_person, phone_number, email,
               physical_address, county, coverage_mode, coverage_details, coverage_entries,
               website, company_profile,
               business_reg_number, business_reg_document, kra_pin, certifications, years_of_operation,
               product_categories, brands_represented, social_media_links,
               declaration, created_at, updated_at
        FROM marketplace_vendor_submissions
        ORDER BY created_at DESC
      `
    );

    const headers = [
      "ID",
      "Company Name",
      "Contact Person",
      "Phone Number",
      "Email",
      "Physical Address",
      "County",
      "Coverage Mode",
      "Coverage Details",
      "Website",
      "Company Profile",
      "Business Reg Number",
      "KRA PIN",
      "Certifications",
      "Years of Operation",
      "Product Categories",
      "Brands Represented",
      "Social Media Links",
      "Declaration",
      "Created At",
      "Updated At"
    ];

    const formatJson = (value) => (value ? JSON.stringify(value) : "");

    const rows = result.rows.map((row) => [
      row.id,
      row.company_name,
      row.contact_person,
      row.phone_number,
      row.email,
      row.physical_address,
      row.county,
      row.coverage_mode,
      row.coverage_details,
      row.website,
      row.company_profile,
      row.business_reg_number,
      formatJson(row.kra_pin),
      formatJson(row.certifications),
      row.years_of_operation,
      Array.isArray(row.product_categories) ? row.product_categories.join(" | ") : row.product_categories,
      row.brands_represented,
      row.social_media_links,
      row.declaration,
      row.created_at,
      row.updated_at
    ]);

    const csv = [headers.map(escapeCsvValue).join(","), ...rows.map((row) => row.map(escapeCsvValue).join(","))].join("\n");

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", 'attachment; filename="marketplace-vendor-submissions.csv"');
    response.send(csv);
  } catch (error) {
    console.error("Marketplace submissions export failed", error);
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to export submissions." });
  }
});

router.get("/settings", async (request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  try {
    const result = await pool.query("SELECT field_config FROM marketplace_settings WHERE id = 'default'");
    const fieldConfig = result.rows[0]?.field_config || {};
    response.json({ fieldConfig });
  } catch (error) {
    console.error("Marketplace settings fetch failed", error);
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to load marketplace settings." });
  }
});

router.put("/settings", requireAdmin, async (request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  const fieldConfig = request.body?.fieldConfig;

  if (typeof fieldConfig !== "object" || fieldConfig === null || Array.isArray(fieldConfig)) {
    return response.status(400).json({ message: "fieldConfig must be an object." });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO marketplace_settings (id, field_config, updated_at)
        VALUES ('default', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (id)
        DO UPDATE SET field_config = EXCLUDED.field_config, updated_at = CURRENT_TIMESTAMP
        RETURNING field_config
      `,
      [fieldConfig]
    );

    response.json({ fieldConfig: result.rows[0].field_config });
  } catch (error) {
    console.error("Marketplace settings update failed", error);
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to save marketplace settings." });
  }
});

export default router;
