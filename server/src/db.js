import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const useSsl = process.env.DATABASE_SSL === "true";

export const databaseState = {
  ready: false,
  lastError: "Database has not connected yet."
};

const createPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    try {
      const databaseUrl = new URL(process.env.DATABASE_URL);

      return {
        host: databaseUrl.hostname || process.env.DB_HOST || "localhost",
        port: Number(databaseUrl.port || process.env.DB_PORT || 5432),
        database: databaseUrl.pathname.replace(/^\//, "") || process.env.DB_NAME || "kerea_listings",
        user: decodeURIComponent(databaseUrl.username || process.env.DB_USER || "postgres"),
        password: `${process.env.DB_PASSWORD ?? decodeURIComponent(databaseUrl.password || "")}`,
        ssl: useSsl
          ? {
              rejectUnauthorized: false
            }
          : false
      };
    } catch {
      return {
        connectionString: process.env.DATABASE_URL,
        password: `${process.env.DB_PASSWORD ?? ""}`,
        ssl: useSsl
          ? {
              rejectUnauthorized: false
            }
          : false
      };
    }
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "kerea_listings",
    user: process.env.DB_USER || "postgres",
    password: `${process.env.DB_PASSWORD ?? ""}`,
    ssl: useSsl
      ? {
          rejectUnauthorized: false
        }
      : false
  };
};

export const pool = new Pool(createPoolConfig());

export const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL,
        consent BOOLEAN NOT NULL,
        full_name TEXT,
        phone_number TEXT,
        category TEXT,
        categories TEXT[] DEFAULT '{}',
        license_number TEXT,
        license_body TEXT,
        county TEXT,
        coverage_mode TEXT,
        coverage_details TEXT,
        decline_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
    `);

    await pool.query(`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS coverage_mode TEXT;
    `);

    await pool.query(`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS coverage_details TEXT;
    `);

    await pool.query(`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS license_body TEXT;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY,
        settings JSONB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_vendor_submissions (
        id UUID PRIMARY KEY,
        company_name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        email TEXT NOT NULL,
        physical_address TEXT DEFAULT '',
        county TEXT DEFAULT '',
        website TEXT DEFAULT '',
        company_profile TEXT DEFAULT '',
        business_reg_number TEXT NOT NULL,
        kra_pin JSONB NOT NULL DEFAULT '{}',
        certifications JSONB DEFAULT '[]',
        years_of_operation TEXT NOT NULL,
        product_categories TEXT[] DEFAULT '{}',
        brands_represented TEXT DEFAULT '',
        social_media_links TEXT DEFAULT '',
        declaration TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS marketplace_vendor_submissions_email_index
        ON marketplace_vendor_submissions (email);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS marketplace_vendor_submissions_created_index
        ON marketplace_vendor_submissions (created_at DESC);
    `);

    await pool.query(`
      ALTER TABLE marketplace_vendor_submissions
        ADD COLUMN IF NOT EXISTS coverage_mode TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS coverage_details TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS coverage_entries JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS business_reg_document JSONB DEFAULT '{}';
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        field_config JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      INSERT INTO marketplace_settings (id, field_config)
      VALUES ('default', '{}')
      ON CONFLICT (id) DO NOTHING;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_library_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        accent_color TEXT DEFAULT '#0f766e',
        resource_count INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_library_resources (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES resource_library_categories(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        summary TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        file_url TEXT DEFAULT '',
        file_path TEXT DEFAULT '',
        file_extension TEXT DEFAULT '',
        mime_type TEXT DEFAULT '',
        file_size BIGINT NOT NULL DEFAULT 0,
        storage_provider TEXT DEFAULT 'local',
        download_count INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        is_published BOOLEAN NOT NULL DEFAULT true,
        allow_downloads BOOLEAN NOT NULL DEFAULT true,
        cover_image_url TEXT DEFAULT '',
        preview_url TEXT DEFAULT '',
        external_url TEXT DEFAULT '',
        resource_type TEXT DEFAULT '',
        tags TEXT[] NOT NULL DEFAULT '{}',
        sort_order INTEGER NOT NULL DEFAULT 0,
        published_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_library_downloads (
        id SERIAL PRIMARY KEY,
        resource_id INTEGER NOT NULL REFERENCES resource_library_resources(id) ON DELETE CASCADE,
        download_source TEXT DEFAULT 'public',
        ip_address TEXT,
        user_agent TEXT,
        downloaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS resource_library_categories_featured_index
        ON resource_library_categories (is_featured, display_order);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS resource_library_resources_category_index
        ON resource_library_resources (category_id, is_published, is_featured);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS resource_library_resources_tags_index
        ON resource_library_resources USING GIN (tags);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS resource_library_downloads_resource_index
        ON resource_library_downloads (resource_id, downloaded_at);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wri_partnership_enquiries (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        organisation TEXT NOT NULL,
        country TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT DEFAULT '',
        organisation_type TEXT NOT NULL,
        technology_sector TEXT NOT NULL,
        area_of_interest TEXT NOT NULL,
        enquiry_type TEXT NOT NULL,
        message TEXT NOT NULL,
        attachment_url TEXT DEFAULT '',
        attachment_name TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS wri_enquiries_status_index
        ON wri_partnership_enquiries (status, created_at DESC);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wri_businesses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        technology TEXT NOT NULL,
        organisation_type TEXT NOT NULL,
        nature_of_business TEXT NOT NULL,
        partnership_interest TEXT NOT NULL,
        description TEXT DEFAULT '',
        logo_url TEXT DEFAULT '',
        website_url TEXT DEFAULT '',
        contact_email TEXT DEFAULT '',
        contact_phone TEXT DEFAULT '',
        is_approved BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS wri_businesses_approved_index
        ON wri_businesses (is_approved, country, technology);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wri_events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        event_date DATE NOT NULL,
        location TEXT NOT NULL,
        description TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        registration_link TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'upcoming',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS wri_events_status_date_index
        ON wri_events (status, event_date);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wri_partners (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        logo_url TEXT DEFAULT '',
        website_url TEXT DEFAULT '',
        description TEXT DEFAULT '',
        is_approved BOOLEAN NOT NULL DEFAULT false,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS wri_partners_approved_index
        ON wri_partners (is_approved, display_order);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wri_resources (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        description TEXT DEFAULT '',
        file_url TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        file_size BIGINT NOT NULL DEFAULT 0,
        external_url TEXT DEFAULT '',
        is_published BOOLEAN NOT NULL DEFAULT true,
        download_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS wri_resources_published_index
        ON wri_resources (is_published, resource_type);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wri_survey_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        position TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        nature_of_business TEXT[] DEFAULT '{}',
        technologies TEXT[] DEFAULT '{}',
        engages_chinese_partners TEXT NOT NULL,
        collaboration_types TEXT[] DEFAULT '{}',
        engagement_duration TEXT NOT NULL,
        challenges TEXT[] DEFAULT '{}',
        support_needed TEXT[] DEFAULT '{}',
        future_interest TEXT NOT NULL,
        interested_activities TEXT[] DEFAULT '{}',
        additional_comments TEXT DEFAULT '',
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS wri_survey_responses_submitted_at_index
        ON wri_survey_responses (submitted_at DESC);
    `);

    await pool.query(`
      ALTER TABLE wri_survey_responses
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_email_key;`);
    await pool.query(`DROP INDEX IF EXISTS submissions_phone_number_unique;`);
    await pool.query(`CREATE INDEX IF NOT EXISTS submissions_email_index ON submissions (email);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS submissions_phone_number_index ON submissions (phone_number);`);

    databaseState.ready = true;
    databaseState.lastError = "";
  } catch (error) {
    if (error?.message?.includes("client password must be a string")) {
      markDatabaseUnavailable(
        new Error("Database password is missing. Set DB_PASSWORD or include a password in DATABASE_URL.")
      );
      return;
    }

    markDatabaseUnavailable(error);
  }
};

export const markDatabaseUnavailable = (error) => {
  databaseState.ready = false;
  databaseState.lastError = error?.message || "Unknown database connection error.";
};
