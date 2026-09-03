import crypto from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { databaseState, initializeDatabase, markDatabaseUnavailable, pool } from "./db.js";
import { requireAdmin, issueAdminToken } from "./auth.js";
import { categories, counties } from "./constants.js";
import { getSiteSettings, resetSiteSettings, updateSiteSettings } from "./siteSettingsStore.js";
import {
  getSolarMkononiSettings,
  resetSolarMkononiSettings,
  updateSolarMkononiSettings
} from "./solarMkononiSettingsStore.js";
import resourceLibraryRouter from "./resourceLibraryRoutes.js";
import marketplaceRouter from "./marketplaceRoutes.js";
import wriRouter from "./wriRoutes.js";
import { escapeCsvValue, sanitizeSubmissionInput, validateSubmission } from "./validators.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = [
  clientUrl,
  ...(process.env.CLIENT_URLS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
];
const adminEmail = `${process.env.ADMIN_EMAIL || "admin@kerea.org"}`.trim().toLowerCase();
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "change-me";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});
const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const normalizeStoredCategories = (submission) => {
  if (Array.isArray(submission?.categories) && submission.categories.length) {
    return [...new Set(submission.categories.map((item) => `${item || ""}`.trim()).filter(Boolean))];
  }

  return `${submission?.category || ""}`
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: false
  })
);
app.use(helmet());
app.use(express.json({ limit: "25mb" }));
app.use(morgan("dev"));

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many submissions from this connection. Please try again later."
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later."
  }
});

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

app.get("/api/health", async (_request, response) => {
  response.status(databaseState.ready ? 200 : 503).json({
    status: databaseState.ready ? "ok" : "degraded",
    databaseReady: databaseState.ready,
    databaseError: databaseState.ready ? "" : databaseState.lastError
  });
});

app.get("/api/meta", (_request, response) => {
  response.json({ categories, counties });
});

app.get("/api/site-settings", async (_request, response) => {
  const settings = await getSiteSettings();
  response.set("Cache-Control", "no-store");
  response.json({ settings });
});

app.put("/api/site-settings", requireAdmin, async (request, response) => {
  try {
    const settings = await updateSiteSettings(request.body || {});
    response.json({ settings });
  } catch (error) {
    response.status(500).json({
      message: "Unable to save site settings.",
      detail: error?.message || "Unknown settings save error."
    });
  }
});

app.post("/api/site-settings/reset", requireAdmin, async (_request, response) => {
  const settings = await resetSiteSettings();
  response.json({ settings });
});

app.get("/api/solar-mkononi-settings", async (_request, response) => {
  const settings = await getSolarMkononiSettings();
  response.set("Cache-Control", "no-store");
  response.json({ settings });
});

app.put("/api/solar-mkononi-settings", requireAdmin, async (request, response) => {
  try {
    const settings = await updateSolarMkononiSettings(request.body || {});
    response.json({ settings });
  } catch (error) {
    response.status(500).json({
      message: "Unable to save Solar Mkononi settings.",
      detail: error?.message || "Unknown settings save error."
    });
  }
});

app.post("/api/solar-mkononi-settings/reset", requireAdmin, async (_request, response) => {
  const settings = await resetSolarMkononiSettings();
  response.json({ settings });
});

app.post("/api/admin/access-gate", authLimiter, (request, response) => {
  const email = `${request.body?.email || ""}`.trim().toLowerCase();
  const consent = request.body?.consent;
  const allowed = email === adminEmail && (consent === false || consent === "false");

  response.json({ allowed });
});

app.post("/api/admin/login", authLimiter, (request, response) => {
  const email = `${request.body?.email || request.body?.username || ""}`.trim().toLowerCase();
  const password = `${request.body?.password || ""}`;

  const matchesEmail = email === adminEmail;
  const matchesLegacyUsername = email === `${adminUsername}`.trim().toLowerCase();

  if ((!matchesEmail && !matchesLegacyUsername) || password !== adminPassword) {
    return response.status(401).json({ message: "Invalid credentials." });
  }

  return response.json({ token: issueAdminToken() });
});

app.post("/api/admin/media", requireAdmin, upload.single("file"), async (request, response) => {
  if (!cloudinaryConfigured) {
    return response.status(503).json({
      message: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    });
  }

  if (!request.file) {
    return response.status(400).json({ message: "No image file was uploaded." });
  }

  if (!request.file.mimetype?.startsWith("image/")) {
    return response.status(400).json({ message: "Only image uploads are allowed." });
  }

  try {
    const dataUri = `data:${request.file.mimetype};base64,${request.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "kerea-listing-portal",
      resource_type: "image"
    });

    return response.json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    return response.status(500).json({
      message: "Unable to upload image to Cloudinary.",
      detail: error?.message || "Unknown Cloudinary upload error."
    });
  }
});

app.use("/api/solar-library", resourceLibraryRouter);
app.use("/api/marketplace", marketplaceRouter);
app.use("/api/wri", wriRouter);

app.post("/api/submissions", submissionLimiter, async (request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  const input = sanitizeSubmissionInput(request.body);
  const validation = validateSubmission(input);

  if (!validation.isValid) {
    return response.status(400).json({
      message: "Please correct the highlighted fields.",
      errors: validation.errors
    });
  }

  try {
    const duplicateResult = await pool.query(
      `
        SELECT email, phone_number, category, categories
        FROM submissions
        WHERE email = $1
           OR ($2 <> '' AND phone_number = $2)
      `,
      [input.email, input.phoneNumber]
    );

    const conflictingSubmission = duplicateResult.rows.find((row) => {
      const existingCategories = normalizeStoredCategories(row);
      return existingCategories.some((category) => input.categories.includes(category));
    });

    if (conflictingSubmission) {
      const duplicateErrors = {};

      if (conflictingSubmission.email === input.email) {
        duplicateErrors.email = "This email address has already been registered for one of the selected roles.";
      }

      if (input.phoneNumber && conflictingSubmission.phone_number === input.phoneNumber) {
        duplicateErrors.phoneNumber = "This phone number has already been registered for one of the selected roles.";
      }

      return response.status(409).json({
        message: "A submission already exists for one or more of the selected roles using this email or phone number.",
        errors: duplicateErrors
      });
    }

    const record = {
      id: crypto.randomUUID(),
      email: input.email,
      consent: input.consent,
      fullName: input.consent ? input.fullName : "",
      phoneNumber: input.consent ? input.phoneNumber : "",
      category: input.consent ? input.category : "",
      categories: input.consent ? input.categories : [],
      licenseNumber: input.consent ? input.licenseNumber : "",
      licenseBody: input.consent ? input.licenseBody : "",
      county: input.consent ? input.county : "",
      coverageMode: input.consent ? input.coverageMode : "",
      coverageDetails: input.consent ? input.coverageDetails : "",
      declineReason: input.consent ? "" : input.declineReason
    };

    const insertResult = await pool.query(
      `
        INSERT INTO submissions (
          id,
          email,
          consent,
          full_name,
          phone_number,
          category,
          categories,
          license_number,
          license_body,
          county,
          coverage_mode,
          coverage_details,
          decline_reason
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, email, consent, full_name, phone_number, category, categories, license_number, license_body, county, coverage_mode, coverage_details, decline_reason, created_at
      `,
      [
        record.id,
        record.email,
        record.consent,
        record.fullName,
        record.phoneNumber,
        record.category,
        record.categories,
        record.licenseNumber,
        record.licenseBody,
        record.county,
        record.coverageMode,
        record.coverageDetails,
        record.declineReason
      ]
    );

    return response.status(201).json({
      message: "Submission received successfully.",
      submission: insertResult.rows[0]
    });
  } catch (error) {
    markDatabaseUnavailable(error);
    if (error.code === "23505") {
      return response.status(409).json({
        message: "A submission already exists for one or more of the selected roles using this email or phone number.",
        errors: {
          email: "This email address or phone number has already been registered for one of the selected roles.",
          phoneNumber: "This email address or phone number has already been registered for one of the selected roles."
        }
      });
    }

    return response.status(500).json({
      message: "Unable to save your submission right now. Please try again shortly."
    });
  }
});

app.get("/api/submissions", requireAdmin, async (_request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  try {
    response.set("Cache-Control", "no-store");
    const result = await pool.query(`
      SELECT id, email, consent, full_name, phone_number, category, categories, license_number, license_body, county, coverage_mode, coverage_details, decline_reason, created_at
      FROM submissions
      ORDER BY created_at DESC
    `);

    response.json({ submissions: result.rows });
  } catch (error) {
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to fetch submissions." });
  }
});

app.delete("/api/submissions/:id", requireAdmin, async (request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  const { id } = request.params;

  try {
    const result = await pool.query("DELETE FROM submissions WHERE id = $1 RETURNING id", [id]);

    if (!result.rows.length) {
      return response.status(404).json({ message: "Submission not found." });
    }

    return response.json({ message: "Submission deleted.", id });
  } catch (error) {
    markDatabaseUnavailable(error);
    return response.status(500).json({ message: "Unable to delete submission." });
  }
});

app.get("/api/submissions/export", requireAdmin, async (_request, response) => {
  if (!(await requireDatabase(response))) {
    return;
  }

  try {
    const result = await pool.query(`
      SELECT id, email, consent, full_name, phone_number, category, categories, license_number, license_body, county, coverage_mode, coverage_details, decline_reason, created_at
      FROM submissions
      ORDER BY created_at DESC
    `);

    const headers = [
      "id",
      "email",
      "consent",
      "full_name",
      "phone_number",
      "category",
      "license_number",
      "license_body",
      "county",
      "coverage_mode",
      "coverage_details",
      "decline_reason",
      "created_at"
    ];

    const rows = result.rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="submissions.csv"'
    );
    response.send(csv);
  } catch (error) {
    markDatabaseUnavailable(error);
    response.status(500).json({ message: "Unable to export submissions." });
  }
});

const startServer = async () => {
  await initializeDatabase();

  if (!databaseState.ready) {
    console.error("Database unavailable at startup", databaseState.lastError);
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
