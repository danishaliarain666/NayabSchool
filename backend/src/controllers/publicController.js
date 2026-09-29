const pool = require('../config/db');
const { calculateGrade, calculatePercentage } = require('../utils/gradeCalculator');

async function getSettings() {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM school_settings');
  return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
}

exports.getHome = async (req, res, next) => {
  try {
    const settings = await getSettings();
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM students WHERE is_active = 1) AS students,
        (SELECT COUNT(*) FROM teachers WHERE is_active = 1) AS teachers,
        (SELECT COUNT(*) FROM classes WHERE is_active = 1) AS classes
    `);

    const [announcements] = await pool.query(
      `SELECT id, title, content, type, publish_date FROM announcements
       WHERE is_published = 1 AND (expiry_date IS NULL OR expiry_date >= CURDATE())
       ORDER BY publish_date DESC LIMIT 5`
    );
    const [news] = await pool.query(
      'SELECT id, title, summary, image_url, publish_date FROM news WHERE is_published = 1 ORDER BY publish_date DESC LIMIT 3'
    );
    const [gallery] = await pool.query(
      'SELECT id, title, image_url, category FROM gallery WHERE is_active = 1 AND is_featured = 1 LIMIT 8'
    );
    const [content] = await pool.query("SELECT * FROM website_content WHERE page_key = 'home' AND is_active = 1");

    res.json({
      success: true,
      data: { settings, stats, announcements, news, gallery, content },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAbout = async (req, res, next) => {
  try {
    const settings = await getSettings();
    const [content] = await pool.query("SELECT * FROM website_content WHERE page_key = 'about' AND is_active = 1");
    res.json({ success: true, data: { settings, content } });
  } catch (err) {
    next(err);
  }
};

exports.getGallery = async (req, res, next) => {
  try {
    const { category } = req.query;
    let where = 'WHERE is_active = 1';
    const params = [];
    if (category) { where += ' AND category = ?'; params.push(category); }
    const [rows] = await pool.query(`SELECT * FROM gallery ${where} ORDER BY created_at DESC`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getContactInfo = async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    await pool.query(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, subject, message]
    );
    await pool.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (1, 'New Contact Message', ?, 'info')",
      [`Message from ${name}: ${subject || 'No subject'}`]
    );
    res.json({ success: true, message: 'Message sent successfully. We will contact you soon.' });
  } catch (err) {
    next(err);
  }
};

exports.submitAdmission = async (req, res, next) => {
  try {
    const { student_name, father_name, date_of_birth, gender, applying_class, phone, address, previous_school } = req.body;
    await pool.query(
      `INSERT INTO admission_applications (student_name, father_name, date_of_birth, gender, applying_class, phone, address, previous_school)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_name, father_name, date_of_birth, gender, applying_class, phone, address, previous_school]
    );
    await pool.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (1, 'New Admission Application', ?, 'warning')",
      [`${student_name} applied for ${applying_class}`]
    );
    res.json({ success: true, message: 'Admission application submitted successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.getWebsiteContent = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM website_content ORDER BY page_key, sort_order');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getSchoolSettings = async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

exports.uploadBrandingFile = async (req, res, next) => {
  try {
    const { type = 'logo' } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const url = `/uploads/branding/${req.file.filename}`;
    const keyMap = {
      banner: 'school_photo_url',
      stamp: 'principal_stamp_url',
      logo: 'logo_url',
    };
    const key = keyMap[type] || 'logo_url';
    await pool.query(
      'INSERT INTO school_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      [key, url]
    );
    res.json({ success: true, message: 'File uploaded.', data: { url, key } });
  } catch (err) {
    next(err);
  }
};

exports.updateSchoolSettings = async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await pool.query(
        'INSERT INTO school_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [key, value]
      );
    }
    res.json({ success: true, message: 'School settings updated.' });
  } catch (err) {
    next(err);
  }
};

exports.updateWebsiteContent = async (req, res, next) => {
  try {
    const { page_key, section_key, title, content, image_url } = req.body;
    await pool.query(
      `INSERT INTO website_content (page_key, section_key, title, content, image_url, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), image_url=VALUES(image_url), updated_by=VALUES(updated_by)`,
      [page_key, section_key, title, content, image_url, req.user.userId]
    );
    res.json({ success: true, message: 'Content updated.' });
  } catch (err) {
    next(err);
  }
};

exports.getNews = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM news WHERE is_published = 1 ORDER BY publish_date DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.manageGallery = async (req, res, next) => {
  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
      return res.json({ success: true, data: rows });
    }
  } catch (err) {
    next(err);
  }
};

exports.addGallery = async (req, res, next) => {
  try {
    const { title, description, category, is_featured } = req.body;
    const image_url = req.file ? `/uploads/gallery/${req.file.filename}` : req.body.image_url;
    const [result] = await pool.query(
      'INSERT INTO gallery (title, description, image_url, category, is_featured, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, image_url, category, is_featured || 0, req.user.userId]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
};

exports.deleteGallery = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Gallery item deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports.calculateGrade = calculateGrade;
module.exports.calculatePercentage = calculatePercentage;
