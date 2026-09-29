const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*,
              u.id AS user_id, u.email AS login_email, u.phone AS login_phone,
              (SELECT COUNT(*) FROM classes c WHERE c.class_teacher_id = t.id AND c.is_active = 1) AS classes_assigned
       FROM teachers t
       LEFT JOIN users u ON u.teacher_id = t.id AND u.role = 'teacher'
       WHERE t.is_active = 1
       ORDER BY t.full_name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS total_teachers,
              COALESCE(SUM(COALESCE(monthly_salary, 30000)), 0) AS total_salary,
              SUM(CASE WHEN salary_paid = 'paid' THEN 1 ELSE 0 END) AS salary_paid_count,
              SUM(CASE WHEN salary_paid = 'unpaid' OR salary_paid IS NULL THEN 1 ELSE 0 END) AS salary_unpaid_count
       FROM teachers WHERE is_active = 1`
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
};

exports.patchPayroll = async (req, res, next) => {
  try {
    const { salary_paid, monthly_salary } = req.body;
    const updates = [];
    const values = [];
    if (salary_paid !== undefined) {
      updates.push('salary_paid = ?');
      values.push(salary_paid);
    }
    if (monthly_salary !== undefined) {
      updates.push('monthly_salary = ?');
      values.push(monthly_salary);
    }
    if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update.' });
    values.push(req.params.id);
    await pool.query(`UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Payroll updated.' });
  } catch (err) {
    next(err);
  }
};

exports.updateLogin = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const teacherId = req.params.id;
    const [users] = await pool.query('SELECT id FROM users WHERE teacher_id = ? AND role = ?', [teacherId, 'teacher']);
    if (!users.length) {
      return res.status(404).json({ success: false, message: 'No login account for this teacher.' });
    }
    const userId = users[0].id;
    if (phone !== undefined) {
      const p = String(phone).replace(/\s/g, '');
      await pool.query('UPDATE users SET phone = ? WHERE id = ?', [p, userId]);
      await pool.query('UPDATE teachers SET phone = ? WHERE id = ?', [p, teacherId]);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
    }
    res.json({ success: true, message: 'Contact and password updated.' });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { employee_id, full_name, father_name, gender, phone, email, qualification, subject, designation, joining_date, address, createLogin, loginEmail, loginPassword } = req.body;
    const photo = req.file ? `/uploads/teachers/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO teachers (employee_id, full_name, father_name, gender, phone, email, qualification, subject, designation, joining_date, photo, address, monthly_salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 30000)`,
      [employee_id, full_name, father_name, gender, phone, email, qualification, subject, designation || 'Teacher', joining_date, photo, address]
    );

    if (createLogin === 'true' && loginEmail && loginPassword) {
      const hash = await bcrypt.hash(loginPassword, 12);
      await pool.query(
        'INSERT INTO users (username, email, password_hash, role, teacher_id) VALUES (?, ?, ?, ?, ?)',
        [full_name.split(' ')[0].toLowerCase(), loginEmail, hash, 'teacher', result.insertId]
      );
    }

    res.status(201).json({ success: true, message: 'Teacher added.', data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const fields = ['employee_id', 'full_name', 'father_name', 'gender', 'phone', 'email', 'qualification', 'subject', 'joining_date', 'address', 'monthly_salary', 'designation', 'bank_account', 'salary_paid'];
    const updates = [];
    const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } });
    if (req.file) { updates.push('photo = ?'); values.push(`/uploads/teachers/${req.file.filename}`); }
    values.push(req.params.id);
    await pool.query(`UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Teacher updated.' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.query('UPDATE teachers SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Teacher deleted.' });
  } catch (err) {
    next(err);
  }
};
