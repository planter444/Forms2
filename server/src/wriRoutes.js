import express from "express";
import multer from "multer";
import { pool } from "./db.js";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configure Cloudinary
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

router.get("/public/settings", async (req, res) => {
  try {
    const result = await pool.query("SELECT settings FROM site_settings WHERE id = 'default'");
    const settings = result.rows[0]?.settings || {};
    const wriSettings = settings.wri || {};
    console.log("Fetched WRI settings from database:", wriSettings);
    res.json({ wri: wriSettings });
  } catch (error) {
    console.error("Error fetching WRI settings:", error);
    res.status(500).json({ error: "Failed to fetch WRI settings" });
  }
});

router.put("/admin/settings", async (req, res) => {
  try {
    const { wri } = req.body;
    console.log("Received WRI settings to save:", wri);
    
    const result = await pool.query("SELECT settings FROM site_settings WHERE id = 'default'");
    const settings = result.rows[0]?.settings || {};
    
    settings.wri = wri;
    
    console.log("Updated settings object:", settings);
    
    // Check if row exists and insert or update accordingly
    if (result.rows.length === 0) {
      await pool.query(
        "INSERT INTO site_settings (id, settings) VALUES ('default', $1)",
        [settings]
      );
      console.log("Inserted new WRI settings");
    } else {
      await pool.query(
        "UPDATE site_settings SET settings = $1 WHERE id = 'default'",
        [settings]
      );
      console.log("Updated existing WRI settings");
    }
    
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

    if (!cloudinaryConfigured) {
      return res.status(503).json({
        error: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
      });
    }

    const { type } = req.body;
    const folder = "wri-hero";
    
    // Convert buffer to data URI
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      resource_type: "image",
      public_id: `${type}-${Date.now()}`
    });

    console.log("Cloudinary upload successful:", result.secure_url);
    res.json({ url: result.secure_url });
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

    // Get survey questions for proper column headers
    const questionsResult = await pool.query("SELECT * FROM wri_survey_questions ORDER BY section_order, question_order");
    const questions = questionsResult.rows;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Survey Responses");

    // Build column headers based on questions
    const columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Submitted At", key: "submitted_at", width: 20 }
    ];

    // Add question columns
    questions.forEach(q => {
      columns.push({
        header: `${q.question_text} ${q.required ? '*' : ''}`,
        key: `q_${q.id}`,
        width: 30
      });
    });

    worksheet.columns = columns;

    // Map responses to question-based format
    const rows = responses.map(response => {
      const row = {
        id: response.id,
        submitted_at: response.submitted_at
      };

      // Map field names to questions
      const fieldMapping = {
        'company_name': 'Company Name',
        'contact_person': 'Contact Person',
        'position': 'Position',
        'email': 'Email',
        'phone': 'Phone',
        'nature_of_business': 'Nature of Business',
        'technologies': 'Technologies',
        'engages_chinese_partners': 'Engages Chinese Partners',
        'collaboration_types': 'Collaboration Types',
        'engagement_duration': 'Engagement Duration',
        'challenges': 'Challenges',
        'support_needed': 'Support Needed',
        'future_interest': 'Future Interest',
        'interested_activities': 'Interested Activities',
        'additional_comments': 'Additional Comments'
      };

      // For now, use the current field mapping
      // TODO: Update to use dynamic question mapping once questions are configured
      Object.keys(fieldMapping).forEach(field => {
        const value = response[field];
        if (Array.isArray(value)) {
          row[field] = value.join(', ');
        } else {
          row[field] = value;
        }
      });

      return row;
    });

    // Add all response columns for backward compatibility
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Company Name", key: "company_name", width: 25 },
      { header: "Contact Person", key: "contact_person", width: 20 },
      { header: "Position", key: "position", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Nature of Business", key: "nature_of_business", width: 30 },
      { header: "Nature of Business (Other)", key: "nature_of_business_other", width: 30 },
      { header: "Technologies", key: "technologies", width: 30 },
      { header: "Technologies (Other)", key: "technologies_other", width: 30 },
      { header: "Engages Chinese Partners", key: "engages_chinese_partners", width: 25 },
      { header: "Collaboration Types", key: "collaboration_types", width: 30 },
      { header: "Collaboration Types (Other)", key: "collaboration_types_other", width: 30 },
      { header: "Engagement Duration", key: "engagement_duration", width: 20 },
      { header: "Challenges", key: "challenges", width: 30 },
      { header: "Challenges (Other)", key: "challenges_other", width: 30 },
      { header: "Support Needed", key: "support_needed", width: 30 },
      { header: "Support Needed (Other)", key: "support_needed_other", width: 30 },
      { header: "Future Interest", key: "future_interest", width: 20 },
      { header: "Interested Activities", key: "interested_activities", width: 30 },
      { header: "Interested Activities (Other)", key: "interested_activities_other", width: 30 },
      { header: "Additional Comments", key: "additional_comments", width: 40 },
      { header: "Submitted At", key: "submitted_at", width: 20 }
    ];

    // Convert array fields to comma-separated strings
    const formattedRows = responses.map(response => ({
      ...response,
      nature_of_business: Array.isArray(response.nature_of_business) ? response.nature_of_business.join(', ') : response.nature_of_business,
      technologies: Array.isArray(response.technologies) ? response.technologies.join(', ') : response.technologies,
      collaboration_types: Array.isArray(response.collaboration_types) ? response.collaboration_types.join(', ') : response.collaboration_types,
      challenges: Array.isArray(response.challenges) ? response.challenges.join(', ') : response.challenges,
      support_needed: Array.isArray(response.support_needed) ? response.support_needed.join(', ') : response.support_needed,
      interested_activities: Array.isArray(response.interested_activities) ? response.interested_activities.join(', ') : response.interested_activities,
      // Add "Other" custom text fields
      nature_of_business_other: response.nature_of_business_other || '',
      technologies_other: response.technologies_other || '',
      collaboration_types_other: response.collaboration_types_other || '',
      challenges_other: response.challenges_other || '',
      support_needed_other: response.support_needed_other || '',
      interested_activities_other: response.interested_activities_other || ''
    }));

    worksheet.addRows(formattedRows);

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Auto-fit column widths
    worksheet.columns.forEach(column => {
      if (column.header) {
        const headerWidth = column.header.toString().length;
        const dataWidth = Math.max(...formattedRows.map(row => {
          const value = row[column.key];
          return value ? value.toString().length : 0;
        }));
        column.width = Math.max(headerWidth, dataWidth) + 2;
      }
    });

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
      additional_comments,
      nature_of_business_other,
      technologies_other,
      collaboration_types_other,
      challenges_other,
      support_needed_other,
      interested_activities_other
    } = req.body;

    const result = await pool.query(
      `UPDATE wri_survey_responses 
       SET company_name = $1, contact_person = $2, position = $3, email = $4, phone = $5, 
           nature_of_business = $6, technologies = $7, engages_chinese_partners = $8, 
           collaboration_types = $9, engagement_duration = $10, challenges = $11, 
           support_needed = $12, future_interest = $13, interested_activities = $14, 
           additional_comments = $15, nature_of_business_other = $16, technologies_other = $17,
           collaboration_types_other = $18, challenges_other = $19, support_needed_other = $20,
           interested_activities_other = $21, updated_at = CURRENT_TIMESTAMP
       WHERE id = $22 RETURNING *`,
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
        nature_of_business_other || "",
        technologies_other || "",
        collaboration_types_other || "",
        challenges_other || "",
        support_needed_other || "",
        interested_activities_other || "",
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

// Survey Questions Management
router.get("/admin/survey-questions", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_survey_questions ORDER BY section_order, question_order");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching survey questions:", error);
    res.status(500).json({ error: "Failed to fetch survey questions" });
  }
});

router.post("/admin/survey-questions", async (req, res) => {
  try {
    const {
      section_order,
      question_order,
      question_text,
      question_type,
      options,
      required
    } = req.body;

    if (!question_text || !question_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO wri_survey_questions (section_order, question_order, question_text, question_type, options, required)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [section_order || 1, question_order || 1, question_text, question_type, options || [], required || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating survey question:", error);
    res.status(500).json({ error: "Failed to create survey question" });
  }
});

router.put("/admin/survey-questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      section_order,
      question_order,
      question_text,
      question_type,
      options,
      required
    } = req.body;

    const result = await pool.query(
      `UPDATE wri_survey_questions
       SET section_order = $1, question_order = $2, question_text = $3, question_type = $4, options = $5, required = $6
       WHERE id = $7
       RETURNING *`,
      [section_order, question_order, question_text, question_type, options, required, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Survey question not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating survey question:", error);
    res.status(500).json({ error: "Failed to update survey question" });
  }
});

router.delete("/admin/survey-questions/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM wri_survey_questions WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting survey question:", error);
    res.status(500).json({ error: "Failed to delete survey question" });
  }
});

router.get("/public/survey-questions", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM wri_survey_questions ORDER BY section_order, question_order");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching public survey questions:", error);
    res.status(500).json({ error: "Failed to fetch survey questions" });
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
