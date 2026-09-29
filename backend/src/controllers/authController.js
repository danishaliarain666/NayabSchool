const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const pool = require('../config/db');

const { phoneVariants } = require('../utils/phoneMatch');
const { getJwtSecret } = require('../utils/jwtSecret');



const USER_SELECT = `SELECT u.*, t.full_name AS teacher_name, t.phone AS teacher_phone, t.email AS teacher_email

  FROM users u LEFT JOIN teachers t ON u.teacher_id = t.id WHERE u.is_active = 1`;



exports.login = async (req, res, next) => {

  try {

    const { email, password } = req.body;

    const loginId = String(email || '').trim();

    if (!loginId || !password) {

      return res.status(400).json({ success: false, message: 'Email or phone and password are required.' });

    }



    let [users] = await pool.query(

      `${USER_SELECT} AND (LOWER(u.email) = LOWER(?) OR LOWER(u.username) = LOWER(?) OR LOWER(t.email) = LOWER(?))`,

      [loginId, loginId, loginId]

    );



    if (!users.length) {

      const variants = phoneVariants(loginId);

      if (variants.length) {

        [users] = await pool.query(`${USER_SELECT} AND (u.phone IN (?) OR t.phone IN (?))`, [variants, variants]);

      }

    }



    if (!users.length) {

      return res.status(401).json({ success: false, message: 'Invalid login or password.' });

    }



    const user = users[0];

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {

      return res.status(401).json({ success: false, message: 'Invalid login or password.' });

    }



    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);



    const token = jwt.sign(

      { userId: user.id, role: user.role, teacherId: user.teacher_id || null },

      await getJwtSecret(),

      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }

    );



    res.json({

      success: true,

      token,

      user: {

        id: user.id,

        username: user.username,

        email: user.email,

        phone: user.phone || user.teacher_phone,

        role: user.role,

        teacherId: user.teacher_id,

        teacherName: user.teacher_name,

      },

    });

  } catch (err) {

    next(err);

  }

};



exports.me = async (req, res, next) => {

  try {

    const [users] = await pool.query(

      `SELECT u.id, u.username, u.email, u.phone, u.role, u.teacher_id, t.full_name AS teacher_name

       FROM users u LEFT JOIN teachers t ON u.teacher_id = t.id WHERE u.id = ?`,

      [req.user.userId]

    );

    if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const u = users[0];

    res.json({

      success: true,

      data: {

        ...u,

        teacherId: u.teacher_id,

        teacherName: u.teacher_name,

      },

    });

  } catch (err) {

    next(err);

  }

};



exports.changePassword = async (req, res, next) => {

  try {

    const { currentPassword, newPassword } = req.body;

    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.userId]);

    const valid = await bcrypt.compare(currentPassword, users[0].password_hash);

    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });



    const hash = await bcrypt.hash(newPassword, 12);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.userId]);

    res.json({ success: true, message: 'Password updated successfully.' });

  } catch (err) {

    next(err);

  }

};

