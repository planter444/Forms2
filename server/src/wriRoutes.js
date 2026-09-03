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
      additional_comments,
      responses_jsonb
    } = req.body;

    // For new dynamic surveys, all data is in responses_jsonb
    // Extract from responses_jsonb if old fields are not provided
    let finalCompanyName = company_name;
    let finalContactPerson = contact_person;
    let finalPosition = position;
    let finalEmail = email;
    let finalPhone = phone;
    let finalNatureOfBusiness = nature_of_business;
    let finalTechnologies = technologies;
    let finalEngagesChinesePartners = engages_chinese_partners;
    let finalCollaborationTypes = collaboration_types;
    let finalEngagementDuration = engagement_duration;
    let finalChallenges = challenges;
    let finalSupportNeeded = support_needed;
    let finalFutureInterest = future_interest;
    let finalInterestedActivities = interested_activities;
    let finalAdditionalComments = additional_comments;

    // Extract from responses_jsonb if provided
    if (responses_jsonb && Object.keys(responses_jsonb).length > 0) {
      Object.entries(responses_jsonb).forEach(([key, value]) => {
        if (key.includes('company_name') && !finalCompanyName) finalCompanyName = value;
        if (key.includes('contact_person') && !finalContactPerson) finalContactPerson = value;
        if (key.includes('position') && !finalPosition) finalPosition = value;
        if (key.includes('email') && !finalEmail) finalEmail = value;
        if (key.includes('phone') && !finalPhone) finalPhone = value;
        if (key.includes('nature_of_business') && !finalNatureOfBusiness) finalNatureOfBusiness = value;
        if (key.includes('technologies') && !finalTechnologies) finalTechnologies = value;
        if (key.includes('engages_chinese_partners') && !finalEngagesChinesePartners) finalEngagesChinesePartners = value;
        if (key.includes('collaboration_types') && !finalCollaborationTypes) finalCollaborationTypes = value;
        if (key.includes('engagement_duration') && !finalEngagementDuration) finalEngagementDuration = value;
        if (key.includes('challenges') && !finalChallenges) finalChallenges = value;
        if (key.includes('support_needed') && !finalSupportNeeded) finalSupportNeeded = value;
        if (key.includes('future_interest') && !finalFutureInterest) finalFutureInterest = value;
        if (key.includes('interested_activities') && !finalInterestedActivities) finalInterestedActivities = value;
        if (key.includes('additional_comments') && !finalAdditionalComments) finalAdditionalComments = value;
      });
    }

    // Accept submission if responses_jsonb has data, even if old fields are missing
    // If responses_jsonb is empty or missing, validate old fields
    if (!responses_jsonb || Object.keys(responses_jsonb).length === 0) {
      // Old format validation
      if (!finalCompanyName || !finalContactPerson || !finalPosition || !finalEmail || !finalPhone || !finalEngagesChinesePartners || !finalEngagementDuration || !finalFutureInterest) {
        return res.status(400).json({ error: "Missing required fields" });
      }
    }

    // For dynamic surveys, use placeholder values for NOT NULL columns if they're missing
    const result = await pool.query(
      `INSERT INTO wri_survey_responses
       (company_name, contact_person, position, email, phone, nature_of_business, technologies, engages_chinese_partners, collaboration_types, engagement_duration, challenges, support_needed, future_interest, interested_activities, additional_comments, responses_jsonb)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        finalCompanyName || "Dynamic Survey",
        finalContactPerson || "Dynamic Survey",
        finalPosition || "Dynamic Survey",
        finalEmail || "dynamic@survey.local",
        finalPhone || "0000000000",
        Array.isArray(finalNatureOfBusiness) ? finalNatureOfBusiness : [],
        Array.isArray(finalTechnologies) ? finalTechnologies : [],
        finalEngagesChinesePartners || "Not specified",
        Array.isArray(finalCollaborationTypes) ? finalCollaborationTypes : [],
        finalEngagementDuration || "Not specified",
        Array.isArray(finalChallenges) ? finalChallenges : [],
        Array.isArray(finalSupportNeeded) ? finalSupportNeeded : [],
        finalFutureInterest || "Not specified",
        Array.isArray(finalInterestedActivities) ? finalInterestedActivities : [],
        finalAdditionalComments || "",
        responses_jsonb || {}
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating survey response:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to submit survey", details: error.message });
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

    // Get survey questions to map IDs to question text and order them
    const questionsResult = await pool.query("SELECT * FROM wri_survey_questions ORDER BY section_order, question_order");
    const questions = questionsResult.rows;

    // Create mapping from question ID to question text
    const questionMap = {};
    questions.forEach(q => {
      questionMap[`question_${q.id}`] = q.question_text;
      questionMap[`question_${q.id}_other`] = `${q.question_text} (Other)`;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Survey Responses");

    // Define base columns
    const columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Submitted At", key: "submitted_at", width: 20 }
    ];

    // Add question columns in order (Q1, Q2, Q3 to last)
    questions.forEach((q, index) => {
      const questionKey = `question_${q.id}`;
      const questionOtherKey = `question_${q.id}_other`;

      // Add main question column
      columns.push({
        header: `Q${index + 1}: ${q.question_text}`,
        key: questionKey,
        width: 35
      });

      // Add "Other" column if any response has "Other" selected
      const hasOther = responses.some(response => {
        if (response.responses_jsonb) {
          const value = response.responses_jsonb[questionKey];
          return Array.isArray(value) ? value.includes("Other") : value === "Other";
        }
        return false;
      });

      if (hasOther) {
        columns.push({
          header: `Q${index + 1}: ${q.question_text} (Other)`,
          key: questionOtherKey,
          width: 35
        });
      }
    });

    worksheet.columns = columns;

    // Format rows with dynamic responses
    const formattedRows = responses.map(response => {
      const row = {
        id: response.id,
        submitted_at: response.submitted_at
      };

      // Add dynamic question values in order
      questions.forEach((q, index) => {
        const questionKey = `question_${q.id}`;
        const questionOtherKey = `question_${q.id}_other`;

        if (response.responses_jsonb) {
          const value = response.responses_jsonb[questionKey];
          const otherValue = response.responses_jsonb[questionOtherKey];

          // Format the main question value
          if (Array.isArray(value)) {
            row[questionKey] = value.join(', ');
          } else if (value !== undefined && value !== null) {
            row[questionKey] = String(value);
          } else {
            row[questionKey] = '';
          }

          // Format the "Other" value
          if (otherValue !== undefined && otherValue !== null) {
            row[questionOtherKey] = String(otherValue);
          } else {
            row[questionOtherKey] = '';
          }
        }
      });

      return row;
    });

    worksheet.addRows(formattedRows);

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 30;

    // Style data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.height = 20;
      }
    });

    // Auto-fit column widths
    worksheet.columns.forEach(column => {
      if (column.header) {
        const headerWidth = column.header.toString().length;
        const dataWidth = Math.max(...formattedRows.map(row => {
          const value = row[column.key];
          return value ? value.toString().length : 0;
        }));
        column.width = Math.max(headerWidth, dataWidth) + 5;
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

// Lead Status Management
router.get("/admin/lead-status", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ls.*, b.name as business_name
      FROM wri_lead_status ls
      JOIN wri_businesses b ON ls.business_id = b.id
      ORDER BY ls.next_follow_up_date ASC NULLS LAST, ls.updated_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching lead status:", error);
    res.status(500).json({ error: "Failed to fetch lead status" });
  }
});

router.get("/admin/lead-status/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const result = await pool.query("SELECT * FROM wri_lead_status WHERE business_id = $1", [businessId]);
    if (result.rows.length === 0) {
      // Create default lead status if doesn't exist
      const newStatus = await pool.query(
        "INSERT INTO wri_lead_status (business_id, status) VALUES ($1, 'new') RETURNING *",
        [businessId]
      );
      res.json(newStatus.rows[0]);
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error("Error fetching lead status:", error);
    res.status(500).json({ error: "Failed to fetch lead status" });
  }
});

router.put("/admin/lead-status/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status, last_contact_date, next_follow_up_date, notes, assigned_to } = req.body;

    const result = await pool.query(
      `UPDATE wri_lead_status 
       SET status = $1, last_contact_date = $2, next_follow_up_date = $3, notes = $4, assigned_to = $5, updated_at = CURRENT_TIMESTAMP
       WHERE business_id = $6
       RETURNING *`,
      [status, last_contact_date, next_follow_up_date, notes, assigned_to, businessId]
    );

    if (result.rows.length === 0) {
      // Create if doesn't exist
      const newStatus = await pool.query(
        `INSERT INTO wri_lead_status (business_id, status, last_contact_date, next_follow_up_date, notes, assigned_to)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [businessId, status, last_contact_date, next_follow_up_date, notes, assigned_to]
      );
      res.json(newStatus.rows[0]);
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error("Error updating lead status:", error);
    res.status(500).json({ error: "Failed to update lead status" });
  }
});

// Lead Activities
router.get("/admin/lead-activities/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const result = await pool.query(
      "SELECT * FROM wri_lead_activities WHERE business_id = $1 ORDER BY created_at DESC",
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching lead activities:", error);
    res.status(500).json({ error: "Failed to fetch lead activities" });
  }
});

router.post("/admin/lead-activities", async (req, res) => {
  try {
    const { business_id, activity_type, description, performed_by, outcome } = req.body;

    if (!business_id || !activity_type || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO wri_lead_activities (business_id, activity_type, description, performed_by, outcome)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [business_id, activity_type, description, performed_by || "", outcome || ""]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating lead activity:", error);
    res.status(500).json({ error: "Failed to create lead activity" });
  }
});

// Lead Scoring
router.get("/admin/lead-scores", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ls.*, b.name as business_name
      FROM wri_lead_scores ls
      JOIN wri_businesses b ON ls.business_id = b.id
      ORDER BY ls.total_score DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching lead scores:", error);
    res.status(500).json({ error: "Failed to fetch lead scores" });
  }
});

router.get("/admin/lead-scores/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const result = await pool.query("SELECT * FROM wri_lead_scores WHERE business_id = $1", [businessId]);
    if (result.rows.length === 0) {
      // Calculate and create score if doesn't exist
      const score = await calculateLeadScore(businessId);
      res.json(score);
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error("Error fetching lead score:", error);
    res.status(500).json({ error: "Failed to fetch lead score" });
  }
});

router.post("/admin/lead-scores/recalculate/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const score = await calculateLeadScore(businessId);
    res.json(score);
  } catch (error) {
    console.error("Error recalculating lead score:", error);
    res.status(500).json({ error: "Failed to recalculate lead score" });
  }
});

// Match Recommendations
router.get("/admin/match-recommendations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT mr.*, 
             b1.name as business_name_1,
             b2.name as business_name_2
      FROM wri_match_recommendations mr
      JOIN wri_businesses b1 ON mr.business_id_1 = b1.id
      JOIN wri_businesses b2 ON mr.business_id_2 = b2.id
      ORDER BY mr.match_score DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching match recommendations:", error);
    res.status(500).json({ error: "Failed to fetch match recommendations" });
  }
});

router.get("/admin/match-recommendations/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const result = await pool.query(`
      SELECT mr.*, 
             b1.name as business_name_1,
             b2.name as business_name_2
      FROM wri_match_recommendations mr
      JOIN wri_businesses b1 ON mr.business_id_1 = b1.id
      JOIN wri_businesses b2 ON mr.business_id_2 = b2.id
      WHERE mr.business_id_1 = $1 OR mr.business_id_2 = $1
      ORDER BY mr.match_score DESC
    `, [businessId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching match recommendations:", error);
    res.status(500).json({ error: "Failed to fetch match recommendations" });
  }
});

router.post("/admin/match-recommendations/generate/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const recommendations = await generateMatchRecommendations(businessId);
    res.json(recommendations);
  } catch (error) {
    console.error("Error generating match recommendations:", error);
    res.status(500).json({ error: "Failed to generate match recommendations" });
  }
});

router.put("/admin/match-recommendations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE wri_match_recommendations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Match recommendation not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating match recommendation:", error);
    res.status(500).json({ error: "Failed to update match recommendation" });
  }
});

// Helper function to calculate lead score
async function calculateLeadScore(businessId) {
  try {
    // Get business details
    const businessResult = await pool.query("SELECT * FROM wri_businesses WHERE id = $1", [businessId]);
    if (businessResult.rows.length === 0) {
      throw new Error("Business not found");
    }
    const business = businessResult.rows[0];

    // Get survey response if exists
    const surveyResult = await pool.query(
      "SELECT * FROM wri_survey_responses WHERE company_name ILIKE $1 LIMIT 1",
      [`%${business.company}%`]
    );
    const survey = surveyResult.rows[0] || {};

    // Calculate scores
    let partnershipInterestScore = 0;
    let companySizeScore = 0;
    let readinessScore = 0;
    let budgetScore = 0;

    // Partnership interest score (0-25)
    if (business.partnership_interest === 'high') partnershipInterestScore = 25;
    else if (business.partnership_interest === 'medium') partnershipInterestScore = 15;
    else if (business.partnership_interest === 'low') partnershipInterestScore = 5;
    else partnershipInterestScore = 10; // default

    // Company size score (0-25)
    if (business.organisation_type === 'Large Corporation') companySizeScore = 25;
    else if (business.organisation_type === 'SME') companySizeScore = 15;
    else if (business.organisation_type === 'Startup') companySizeScore = 10;
    else companySizeScore = 15; // default

    // Readiness score based on survey (0-25)
    if (survey.engages_chinese_partners === 'Yes') readinessScore = 25;
    else if (survey.engages_chinese_partners === 'Planning to') readinessScore = 15;
    else readinessScore = 5;

    // Budget score (estimated from company size and sector) (0-25)
    if (business.organisation_type === 'Large Corporation') budgetScore = 25;
    else if (business.organisation_type === 'SME') budgetScore = 15;
    else budgetScore = 10;

    const totalScore = partnershipInterestScore + companySizeScore + readinessScore + budgetScore;

    // Upsert lead score
    const existingScore = await pool.query("SELECT * FROM wri_lead_scores WHERE business_id = $1", [businessId]);
    
    let scoreResult;
    if (existingScore.rows.length > 0) {
      scoreResult = await pool.query(
        `UPDATE wri_lead_scores 
         SET total_score = $1, partnership_interest_score = $2, company_size_score = $3, readiness_score = $4, budget_score = $5,
             last_calculated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE business_id = $6 RETURNING *`,
        [totalScore, partnershipInterestScore, companySizeScore, readinessScore, budgetScore, businessId]
      );
    } else {
      scoreResult = await pool.query(
        `INSERT INTO wri_lead_scores (business_id, total_score, partnership_interest_score, company_size_score, readiness_score, budget_score)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [businessId, totalScore, partnershipInterestScore, companySizeScore, readinessScore, budgetScore]
      );
    }

    return scoreResult.rows[0];
  } catch (error) {
    console.error("Error calculating lead score:", error);
    throw error;
  }
}

// Helper function to generate match recommendations
async function generateMatchRecommendations(businessId) {
  try {
    // Get target business
    const targetResult = await pool.query("SELECT * FROM wri_businesses WHERE id = $1", [businessId]);
    if (targetResult.rows.length === 0) {
      throw new Error("Business not found");
    }
    const target = targetResult.rows[0];

    // Get all other approved businesses
    const allBusinessesResult = await pool.query(
      "SELECT * FROM wri_businesses WHERE id != $1 AND is_approved = true",
      [businessId]
    );
    const allBusinesses = allBusinessesResult.rows;

    const recommendations = [];

    for (const business of allBusinesses) {
      let matchScore = 0;
      const matchReasons = [];

      // Technology complementarity (0-30)
      if (target.technology === business.technology) {
        matchScore += 30;
        matchReasons.push("Same technology focus");
      } else {
        // Check for complementary technologies
        const complementaryTechs = {
          'Solar PV': ['Energy Storage', 'Solar Water Heating'],
          'Energy Storage': ['Solar PV', 'Wind', 'Mini-grids'],
          'Wind': ['Energy Storage', 'Mini-grids'],
          'Mini-grids': ['Energy Storage', 'Solar PV', 'Wind'],
          'Clean Cooking': ['Biogas', 'Solar Water Heating'],
          'Biogas': ['Clean Cooking', 'Energy Storage'],
          'E-mobility': ['Energy Storage', 'Charging Infrastructure'],
          'Productive Use': ['Solar PV', 'Energy Storage']
        };

        if (complementaryTechs[target.technology]?.includes(business.technology)) {
          matchScore += 20;
          matchReasons.push("Complementary technology");
        }
      }

      // Geographic proximity (0-20)
      if (target.country === business.country) {
        matchScore += 20;
        matchReasons.push("Same country");
      } else if (target.country === 'Kenya' && business.country === 'China') {
        matchScore += 15;
        matchReasons.push("Kenya-China partnership potential");
      }

      // Partnership interest alignment (0-25)
      if (target.partnership_interest === 'high' && business.partnership_interest === 'high') {
        matchScore += 25;
        matchReasons.push("Both highly interested in partnerships");
      } else if (target.partnership_interest === business.partnership_interest) {
        matchScore += 15;
        matchReasons.push("Similar partnership interest level");
      }

      // Organization type complementarity (0-15)
      const typeComplementarity = {
        'Large Corporation': ['SME', 'Startup'],
        'SME': ['Large Corporation', 'Startup'],
        'Startup': ['Large Corporation', 'SME'],
        'Government Agency': ['Large Corporation', 'SME'],
        'Research Institution': ['Large Corporation', 'Startup']
      };

      if (typeComplementarity[target.organisation_type]?.includes(business.organisation_type)) {
        matchScore += 15;
        matchReasons.push("Complementary organization types");
      }

      // Nature of business alignment (0-10)
      if (target.nature_of_business === business.nature_of_business) {
        matchScore += 10;
        matchReasons.push("Similar business nature");
      }

      // Only save if match score is above threshold
      if (matchScore >= 30) {
        // Upsert match recommendation
        const upsertResult = await pool.query(
          `INSERT INTO wri_match_recommendations (business_id_1, business_id_2, match_score, match_reasons, status)
           VALUES ($1, $2, $3, $4, 'pending')
           ON CONFLICT (business_id_1, business_id_2) DO UPDATE SET
             match_score = EXCLUDED.match_score,
             match_reasons = EXCLUDED.match_reasons,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [businessId, business.id, matchScore, matchReasons]
        );
        recommendations.push(upsertResult.rows[0]);
      }
    }

    return recommendations;
  } catch (error) {
    console.error("Error generating match recommendations:", error);
    throw error;
  }
}

export default router;
