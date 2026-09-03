import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, "../data/solar-resource-library");
export const resourceLibraryRoot = path.resolve(process.env.SOLAR_RESOURCE_LIBRARY_ROOT || defaultRoot);

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

const toDataUri = ({ buffer, mimeType }) => {
  if (!buffer || !buffer.length) {
    return "";
  }
  return `data:${mimeType || "application/octet-stream"};base64,${buffer.toString("base64")}`;
};

const randomSuffix = () => crypto.randomBytes(6).toString("hex");

const normalizeSegment = (value) =>
  `${value || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120) || "file";

export const ensureResourceLibraryRoot = async () => {
  await mkdir(resourceLibraryRoot, { recursive: true });
};

export const saveResourceFile = async ({ buffer, originalName, mimeType }) => {
  if (!buffer?.length) {
    throw new Error("Uploaded file buffer is empty.");
  }

  if (cloudinaryConfigured) {
    const result = await cloudinary.uploader.upload(toDataUri({ buffer, mimeType }), {
      resource_type: "raw",
      folder: "kerea-listing-portal/resources"
    });

    return {
      fileName: originalName || result.original_filename || "resource",
      fileUrl: result.secure_url,
      relativePath: "",
      absolutePath: result.secure_url,
      mimeType: mimeType || "application/octet-stream",
      fileExtension: path.extname(originalName || "").replace(/^\./, "") || result.format || "",
      fileSize: result.bytes || buffer.length,
      storageProvider: "cloudinary",
      publicId: result.public_id
    };
  }

  await ensureResourceLibraryRoot();
  const now = new Date();
  const year = `${now.getUTCFullYear()}`;
  const month = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const directory = path.join(resourceLibraryRoot, year, month);
  await mkdir(directory, { recursive: true });

  const ext = `${path.extname(originalName || "").toLowerCase()}`;
  const base = normalizeSegment(path.basename(originalName || "resource", ext));
  const fileName = `${base}-${randomSuffix()}${ext}`;
  const filePath = path.join(directory, fileName);
  await writeFile(filePath, buffer);

  return {
    fileName,
    fileUrl: "",
    relativePath: path.relative(resourceLibraryRoot, filePath).replace(/\\/g, "/"),
    absolutePath: filePath,
    mimeType: mimeType || "application/octet-stream",
    fileExtension: ext.replace(/^\./, ""),
    fileSize: buffer.length,
    storageProvider: "local",
    publicId: ""
  };
};

export const deleteResourceFile = async (relativePath) => {
  if (!relativePath) {
    return;
  }

  const absolutePath = path.resolve(resourceLibraryRoot, relativePath);

  try {
    await rm(absolutePath);
  } catch {}
};

export const resolveResourceFilePath = (relativePath) =>
  relativePath ? path.resolve(resourceLibraryRoot, relativePath) : "";

const coverDirectory = path.join(resourceLibraryRoot, "covers");

export const saveCoverImage = async ({ buffer, originalName, mimeType }) => {
  if (!buffer?.length) {
    throw new Error("Uploaded cover image buffer is empty.");
  }

  if (cloudinaryConfigured) {
    const result = await cloudinary.uploader.upload(toDataUri({ buffer, mimeType }), {
      resource_type: "image",
      folder: "kerea-listing-portal/covers"
    });

    return {
      fileName: originalName || result.original_filename || "cover",
      coverImageUrl: result.secure_url,
      relativePath: "",
      absolutePath: result.secure_url,
      mimeType: mimeType || "image/jpeg",
      fileExtension: path.extname(originalName || "").replace(/^\./, "") || result.format || "",
      fileSize: result.bytes || buffer.length,
      storageProvider: "cloudinary",
      publicId: result.public_id
    };
  }

  await mkdir(coverDirectory, { recursive: true });

  const ext = `${path.extname(originalName || "").toLowerCase()}` || ".jpg";
  const base = normalizeSegment(path.basename(originalName || "cover", ext)) || "cover";
  const fileName = `${base}-${randomSuffix()}${ext}`;
  const filePath = path.join(coverDirectory, fileName);
  await writeFile(filePath, buffer);

  return {
    fileName,
    coverImageUrl: `/api/solar-library/covers/${fileName}`,
    relativePath: path.relative(resourceLibraryRoot, filePath).replace(/\\/g, "/"),
    absolutePath: filePath,
    mimeType: mimeType || "image/jpeg",
    fileExtension: ext.replace(/^\./, ""),
    fileSize: buffer.length,
    storageProvider: "local",
    publicId: ""
  };
};

export const deleteCoverImage = async (fileName) => {
  if (!fileName) {
    return;
  }

  const safeName = path.basename(fileName);
  if (!safeName || safeName.includes("..")) {
    return;
  }

  const absolutePath = path.join(coverDirectory, safeName);

  try {
    await rm(absolutePath);
  } catch {}
};

export const resolveCoverImagePath = (fileName) => {
  if (!fileName) {
    return "";
  }

  const safeName = path.basename(fileName);
  if (!safeName || safeName.includes("..")) {
    return "";
  }

  return path.join(coverDirectory, safeName);
};
