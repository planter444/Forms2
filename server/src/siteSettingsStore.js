import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultSiteSettings } from "./defaultSiteSettings.js";
import { databaseState, pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.resolve(__dirname, "../data");
const settingsPath = path.resolve(dataDirectory, "site-settings.json");

const clone = (value) => JSON.parse(JSON.stringify(value));

const mergeSettings = (base, updates) => {
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return clone(base);
  }

  const output = Array.isArray(base) ? [...base] : { ...base };

  Object.entries(updates).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      output[key] = mergeSettings(base[key], value);
      return;
    }

    output[key] = value;
  });

  return output;
};

const ensureStore = async () => {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(settingsPath, "utf8");
  } catch {
    await writeFile(settingsPath, JSON.stringify(defaultSiteSettings, null, 2), "utf8");
  }
};

const getDatabaseSettings = async () => {
  if (!databaseState.ready) {
    return null;
  }

  const result = await pool.query("SELECT settings FROM site_settings WHERE id = $1", ["default"]);
  return result.rows[0]?.settings || null;
};

const saveDatabaseSettings = async (settings) => {
  if (!databaseState.ready) {
    return false;
  }

  await pool.query(
    `
      INSERT INTO site_settings (id, settings, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (id)
      DO UPDATE SET settings = EXCLUDED.settings, updated_at = CURRENT_TIMESTAMP
    `,
    ["default", settings]
  );

  return true;
};

export const getSiteSettings = async () => {
  try {
    const databaseSettings = await getDatabaseSettings();

    if (databaseSettings) {
      return mergeSettings(defaultSiteSettings, databaseSettings);
    }
  } catch {}

  await ensureStore();

  try {
    const raw = await readFile(settingsPath, "utf8");
    const parsed = JSON.parse(raw);
    return mergeSettings(defaultSiteSettings, parsed);
  } catch {
    return clone(defaultSiteSettings);
  }
};

export const updateSiteSettings = async (updates) => {
  const current = await getSiteSettings();
  const next = mergeSettings(current, updates);
  const savedToDatabase = await saveDatabaseSettings(next);

  if (!savedToDatabase) {
    await writeFile(settingsPath, JSON.stringify(next, null, 2), "utf8");
  }

  return next;
};

export const resetSiteSettings = async () => {
  const current = await getSiteSettings();
  const defaults = clone(defaultSiteSettings);
  const next = mergeSettings(current, {
    theme: {
      ...defaults.theme,
      colors: defaults.theme.colors
    }
  });
  const savedToDatabase = await saveDatabaseSettings(next);

  if (!savedToDatabase) {
    await ensureStore();
    await writeFile(settingsPath, JSON.stringify(next, null, 2), "utf8");
  }

  return next;
};
