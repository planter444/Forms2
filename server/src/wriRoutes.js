import express from "express";
import multer from "multer";
import { pool } from "./db.js";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/public/settings", async (req, res) => {
  try {
    const result = await pool.query("SELECT settings FROM site_settings WHERE id = 'default'");
    const settings = result.rows[0]?.settings || {};
    const wriSettings = settings.wri || {};
    res.json({ wri: wriSettings });
  } catch (error) {
    console.error("Error fetching WRI settings:", error);
    res.status(500).json({ error: "Failed to fetch WRI settings" });
  }
});

router.put("/admin/settings", async (req, res) => {
  try {
    const { wri } = req.body;
    
    const result = await pool.query("SELECT settings FROM site_settings WHERE id = 'default'");
    const settings = result.rows[0]?.settings || {};
    
    settings.wri = wri;
    
    await pool.query(
      "UPDATE site_settings SET settings = $1 WHERE id = 'default'",
      [settings]
    );
    
    res.json({ success: true, wri });
  } catch (error) {
    console.error("Error updating WRI settings:", error);
    res.status(500).json({ error: "Failed to update WRI settings" });
  }
});

router.post("/admin/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { type } = req.body;
    const fileName = `${type}-${Date.now()}-${req.file.originalname}`;
    const filePath = `/uploads/wri/${fileName}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "wri");
    console.log("Upload directory:", uploadsDir);
    
    if (!fs.existsSync(uploadsDir)) {
      console.log("Creating upload directory:", uploadsDir);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fullPath = path.join(process.cwd(), "public", filePath);
    console.log("Writing file to:", fullPath);
    fs.writeFileSync(fullPath, req.file.buffer);

    res.json({ url: filePath });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file: " + error.message });
  }
});

router.post("/enquiries", upload.single("attachment"), async (req, res) => {
  try {
    const { name, organisation, country, email, phone, organisation_type, technology_sector, area_of_interest, enquiry_type, message } = req.body;
    
    if (!name || !organisation || !country || !email || !organisation_type || !technology_sector || !area_of_interest || !enquiry_type || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const attachmentUrl = req.file ? `/uploads/wri/${Date.now()}_${req.file.originalname}` : "";
    const attachmentName = req.file ? req.file.originalname : "";

    const result = await pool.query(
      `INSERT INTO wri_partnership_enquiries 
       (name, organisation, country, email, phone, organisation_type, technology_sector, area_of_interest, enquiry_type, message, attachment_url, attachment_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, organisation, country, email, phone || "", organisation_type, technology_sector, area_of_interest, enquiry_type, message, attachmentUrl, attachmentName]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating WRI enquiry:", error);
    res.status(500).json({ error: "Failed to create enquiry" });
  }
});

router.get("/admin/enquiries", async (req, res) => {
  try {
    const { status } = req.query;
    let query = "SELECT * FROM wri_partnership_enquiries";
    const params = [];
    
    if (status) {
      query += " WHERE status = $1";
      params.push(status);
    }
    
    query += " ORDER BY created_at DESC";
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching WRI enquiries:", error);
    res.status(500).json({ error: "Failed to fetch enquiries" });
  }
});

router.put("/admin/enquiries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      "UPDATE wri_partnership_enquiries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id]
    );
    
    if (!result.rowCount) {
      return res.status(404).json({ error: "Enquiry not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating WRI enquiry:", error);
    res.status(500).json({ error: "Failed to update enquiry" });
  }
});

router.delete("/admin/enquiries/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM wri_partnership_enquiries WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    res.status(500).json({ error: "Failed to delete enquiry" });
  }
});

router.get("/admin/enquiries/excel", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_partnership_enquiries ORDER BY created_at DESC");
    const enquiries = result.rows;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Enquiries");

    worksheet.columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
      { header: "Organisation", key: "organisation" },
      { header: "Country", key: "country" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phone" },
      { header: "Organisation Type", key: "organisation_type" },
      { header: "Technology Sector", key: "technology_sector" },
      { header: "Area of Interest", key: "area_of_interest" },
      { header: "Enquiry Type", key: "enquiry_type" },
      { header: "Message", key: "message" },
      { header: "Attachment", key: "attachment_name" },
      { header: "Status", key: "status" },
      { header: "Created At", key: "created_at" }
    ];

    worksheet.addRows(enquiries);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=wri-enquiries-${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ error: "Failed to generate Excel" });
  }
});

router.post("/survey", async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      position,
      email,
      phone,
      nature_of_business,
      technologies,
      engages_chinese_partners,
      collaboration_types,
      engagement_duration,
      challenges,
      support_needed,
      future_interest,
      interested_activities,
      additional_comments
    } = req.body;

    if (!company_name || !contact_person || !position || !email || !phone || !engages_chinese_partners || !engagement_duration || !future_interest) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO wri_survey_responses 
       (company_name, contact_person, position, email, phone, nature_of_business, technologies, engages_chinese_partners, collaboration_types, engagement_duration, challenges, support_needed, future_interest, interested_activities, additional_comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        company_name,
        contact_person,
        position,
        email,
        phone,
        nature_of_business || [],
        technologies || [],
        engages_chinese_partners,
        collaboration_types || [],
        engagement_duration,
        challenges || [],
        support_needed || [],
        future_interest,
        interested_activities || [],
        additional_comments || ""
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating survey response:", error);
    res.status(500).json({ error: "Failed to submit survey" });
  }
});

router.get("/admin/survey-responses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_survey_responses ORDER BY submitted_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching survey responses:", error);
    res.status(500).json({ error: "Failed to fetch survey responses" });
  }
});

router.get("/admin/survey-responses/excel", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_survey_responses ORDER BY submitted_at DESC");
    const responses = result.rows;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Survey Responses");

    worksheet.columns = [
      { header: "ID", key: "id" },
      { header: "Company Name", key: "company_name" },
      { header: "Contact Person", key: "contact_person" },
      { header: "Position", key: "position" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phone" },
      { header: "Nature of Business", key: "nature_of_business" },
      { header: "Technologies", key: "technologies" },
      { header: "Engages Chinese Partners", key: "engages_chinese_partners" },
      { header: "Collaboration Types", key: "collaboration_types" },
      { header: "Engagement Duration", key: "engagement_duration" },
      { header: "Challenges", key: "challenges" },
      { header: "Support Needed", key: "support_needed" },
      { header: "Future Interest", key: "future_interest" },
      { header: "Interested Activities", key: "interested_activities" },
      { header: "Additional Comments", key: "additional_comments" },
      { header: "Submitted At", key: "submitted_at" }
    ];

    worksheet.addRows(responses);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=wri-survey-responses-${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating survey Excel:", error);
    res.status(500).json({ error: "Failed to generate Excel" });
  }
});

router.put("/admin/survey-responses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company_name,
      contact_person,
      position,
      email,
      phone,
      nature_of_business,
      technologies,
      engages_chinese_partners,
      collaboration_types,
      engagement_duration,
      challenges,
      support_needed,
      future_interest,
      interested_activities,
      additional_comments
    } = req.body;

    const result = await pool.query(
      `UPDATE wri_survey_responses 
       SET company_name = $1, contact_person = $2, position = $3, email = $4, phone = $5, 
           nature_of_business = $6, technologies = $7, engages_chinese_partners = $8, 
           collaboration_types = $9, engagement_duration = $10, challenges = $11, 
           support_needed = $12, future_interest = $13, interested_activities = $14, 
           additional_comments = $15, updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 RETURNING *`,
      [
        company_name,
        contact_person,
        position,
        email,
        phone,
        nature_of_business || [],
        technologies || [],
        engages_chinese_partners,
        collaboration_types || [],
        engagement_duration,
        challenges || [],
        support_needed || [],
        future_interest,
        interested_activities || [],
        additional_comments || "",
        id
      ]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Survey response not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating survey response:", error);
    res.status(500).json({ error: "Failed to update survey response" });
  }
});

router.delete("/admin/survey-responses/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM wri_survey_responses WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting survey response:", error);
    res.status(500).json({ error: "Failed to delete survey response" });
  }
});

router.get("/public/businesses", async (req, res) => {
  try {
    const { country, technology, organisation_type, nature_of_business, partnership_interest } = req.query;
    let query = "SELECT * FROM wri_businesses WHERE is_approved = true";
    const params = [];
    let paramIndex = 1;
    
    if (country) {
      query += ` AND country = $${paramIndex++}`;
      params.push(country);
    }
    if (technology) {
      query += ` AND technology = $${paramIndex++}`;
      params.push(technology);
    }
    if (organisation_type) {
      query += ` AND organisation_type = $${paramIndex++}`;
      params.push(organisation_type);
    }
    if (nature_of_business) {
      query += ` AND nature_of_business = $${paramIndex++}`;
      params.push(nature_of_business);
    }
    if (partnership_interest) {
      query += ` AND partnership_interest = $${paramIndex++}`;
      params.push(partnership_interest);
    }
    
    query += " ORDER BY created_at DESC";
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching WRI businesses:", error);
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

router.get("/admin/businesses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_businesses ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching WRI businesses:", error);
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

router.post("/admin/businesses", async (req, res) => {
  try {
    const { name, country, technology, organisation_type, nature_of_business, partnership_interest, description, logo_url, website_url, contact_email, contact_phone, is_approved } = req.body;
    
    if (!name || !country || !technology || !organisation_type || !nature_of_business || !partnership_interest) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await pool.query(
      `INSERT INTO wri_businesses 
       (name, country, technology, organisation_type, nature_of_business, partnership_interest, description, logo_url, website_url, contact_email, contact_phone, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, country, technology, organisation_type, nature_of_business, partnership_interest, description || "", logo_url || "", website_url || "", contact_email || "", contact_phone || "", is_approved !== undefined ? is_approved : false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating WRI business:", error);
    res.status(500).json({ error: "Failed to create business" });
  }
});

router.put("/admin/businesses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, technology, organisation_type, nature_of_business, partnership_interest, description, logo_url, website_url, contact_email, contact_phone, is_approved } = req.body;
    
    const result = await pool.query(
      `UPDATE wri_businesses 
       SET name = $1, country = $2, technology = $3, organisation_type = $4, nature_of_business = $5, partnership_interest = $6, 
           description = $7, logo_url = $8, website_url = $9, contact_email = $10, contact_phone = $11, is_approved = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 RETURNING *`,
      [name, country, technology, organisation_type, nature_of_business, partnership_interest, description || "", logo_url || "", website_url || "", contact_email || "", contact_phone || "", is_approved !== undefined ? is_approved : false, id]
    );
    
    if (!result.rowCount) {
      return res.status(404).json({ error: "Business not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating WRI business:", error);
    res.status(500).json({ error: "Failed to update business" });
  }
});

router.delete("/admin/businesses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM wri_businesses WHERE id = $1", [id]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting WRI business:", error);
    res.status(500).json({ error: "Failed to delete business" });
  }
});

router.get("/public/events", async (req, res) => {
  try {
    const { status } = req.query;
    let query = "SELECT * FROM wri_events";
    const params = [];
    
    if (status) {
      query += " WHERE status = $1";
      params.push(status);
    }
    
    query += " ORDER BY event_date ASC";
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching WRI events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.get("/admin/events", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_events ORDER BY event_date DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching WRI events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.post("/admin/events", async (req, res) => {
  try {
    const { title, event_date, location, description, image_url, registration_link, status } = req.body;
    
    if (!title || !event_date || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await pool.query(
      `INSERT INTO wri_events (title, event_date, location, description, image_url, registration_link, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, event_date, location, description || "", image_url || "", registration_link || "", status || "upcoming"]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating WRI event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.put("/admin/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, event_date, location, description, image_url, registration_link, status } = req.body;
    
    const result = await pool.query(
      `UPDATE wri_events 
       SET title = $1, event_date = $2, location = $3, description = $4, image_url = $5, registration_link = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [title, event_date, location, description || "", image_url || "", registration_link || "", status || "upcoming", id]
    );
    
    if (!result.rowCount) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating WRI event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/admin/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM wri_events WHERE id = $1", [id]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting WRI event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

router.get("/public/partners", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_partners WHERE is_approved = true ORDER BY display_order ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching WRI partners:", error);
    res.status(500).json({ error: "Failed to fetch partners" });
  }
});

router.get("/admin/partners", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_partners ORDER BY display_order ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching WRI partners:", error);
    res.status(500).json({ error: "Failed to fetch partners" });
  }
});

router.post("/admin/partners", async (req, res) => {
  try {
    const { name, logo_url, website_url, description, is_approved, display_order } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await pool.query(
      `INSERT INTO wri_partners (name, logo_url, website_url, description, is_approved, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, logo_url || "", website_url || "", description || "", is_approved !== undefined ? is_approved : false, display_order || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating WRI partner:", error);
    res.status(500).json({ error: "Failed to create partner" });
  }
});

router.put("/admin/partners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo_url, website_url, description, is_approved, display_order } = req.body;
    
    const result = await pool.query(
      `UPDATE wri_partners 
       SET name = $1, logo_url = $2, website_url = $3, description = $4, is_approved = $5, display_order = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name, logo_url || "", website_url || "", description || "", is_approved !== undefined ? is_approved : false, display_order || 0, id]
    );
    
    if (!result.rowCount) {
      return res.status(404).json({ error: "Partner not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating WRI partner:", error);
    res.status(500).json({ error: "Failed to update partner" });
  }
});

router.delete("/admin/partners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM wri_partners WHERE id = $1", [id]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting WRI partner:", error);
    res.status(500).json({ error: "Failed to delete partner" });
  }
});

router.get("/public/resources", async (req, res) => {
  try {
    const { resource_type } = req.query;
    let query = "SELECT * FROM wri_resources WHERE is_published = true";
    const params = [];
    
    if (resource_type) {
      query += " AND resource_type = $1";
      params.push(resource_type);
    }
    
    query += " ORDER BY created_at DESC";
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching WRI resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

router.get("/admin/resources", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_resources ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching WRI resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

router.post("/admin/resources", async (req, res) => {
  try {
    const { title, resource_type, description, file_url, file_name, file_size, external_url, is_published } = req.body;
    
    if (!title || !resource_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await pool.query(
      `INSERT INTO wri_resources (title, resource_type, description, file_url, file_name, file_size, external_url, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, resource_type, description || "", file_url || "", file_name || "", 0, external_url || "", is_published !== undefined ? is_published : true]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating WRI resource:", error);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

router.put("/admin/resources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, resource_type, description, file_url, file_name, file_size, external_url, is_published } = req.body;
    
    const result = await pool.query(
      `UPDATE wri_resources 
       SET title = $1, resource_type = $2, description = $3, file_url = $4, file_name = $5, file_size = $6, external_url = $7, is_published = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [title, resource_type, description || "", file_url || "", file_name || "", 0, external_url || "", is_published !== undefined ? is_published : true, id]
    );
    
    if (!result.rowCount) {
      return res.status(404).json({ error: "Resource not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating WRI resource:", error);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

router.delete("/admin/resources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM wri_resources WHERE id = $1", [id]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting WRI resource:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
