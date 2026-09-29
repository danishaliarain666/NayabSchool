const pool = require('../config/db');

const { fmt, eachDay } = require('../utils/schoolDays');



exports.list = async (req, res, next) => {

  try {

    const [rows] = await pool.query(

      `SELECT id, holiday_date, title, announcement_id FROM school_holidays

       ORDER BY holiday_date DESC LIMIT 400`

    );

    res.json({ success: true, data: rows });

  } catch (err) {

    next(err);

  }

};



exports.create = async (req, res, next) => {

  try {

    const { title, from, to, date, postAnnouncement } = req.body;

    const fromD = fmt(from || date);

    const toD = fmt(to || from || date);

    if (!fromD) return res.status(400).json({ success: false, message: 'From date is required.' });

    if (toD < fromD) {

      return res.status(400).json({ success: false, message: 'To date cannot be before from date.' });

    }



    const label = (title || 'Holiday').trim() || 'Holiday';

    const days = eachDay(fromD, toD);

    const shouldAnnounce = postAnnouncement !== false;

    let announcementId = null;



    if (shouldAnnounce) {

      const annTitle = fromD === toD ? `Holiday — ${label}` : `Holiday — ${label} (${fromD} to ${toD})`;

      const content =

        fromD === toD

          ? `School will remain closed on ${fromD}. (${label})`

          : `School will remain closed from ${fromD} to ${toD}. (${label})`;

      const userId = req.user?.userId || 1;

      const [result] = await pool.query(

        `INSERT INTO announcements (title, content, type, is_published, publish_date, expiry_date, created_by)

         VALUES (?, ?, 'holiday', 1, CURDATE(), ?, ?)`,

        [annTitle, content, toD, userId]

      );

      announcementId = result.insertId;

    }



    for (const holidayDate of days) {
      try {
        await pool.query(
          `INSERT INTO school_holidays (holiday_date, title, announcement_id) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE title = VALUES(title),
             announcement_id = COALESCE(VALUES(announcement_id), announcement_id)`,
          [holidayDate, label, announcementId]
        );
      } catch {
        await pool.query(
          `INSERT INTO school_holidays (holiday_date, title) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE title = VALUES(title)`,
          [holidayDate, label]
        );
      }
      await pool.query('DELETE FROM attendance WHERE date = ?', [holidayDate]).catch(() => {});
      await pool.query('DELETE FROM staff_attendance WHERE attendance_date = ?', [holidayDate]).catch(() => {});
    }



    res.status(201).json({

      success: true,

      message: days.length > 1 ? `Holiday saved for ${days.length} days.` : 'Holiday saved.',

    });

  } catch (err) {

    next(err);

  }

};



exports.remove = async (req, res, next) => {

  try {

    const [rows] = await pool.query(

      'SELECT announcement_id FROM school_holidays WHERE id = ? LIMIT 1',

      [req.params.id]

    );

    const annId = rows[0]?.announcement_id;

    await pool.query('DELETE FROM school_holidays WHERE id = ?', [req.params.id]);

    if (annId) {

      const [left] = await pool.query(

        'SELECT id FROM school_holidays WHERE announcement_id = ? LIMIT 1',

        [annId]

      );

      if (!left.length) {

        await pool.query('DELETE FROM announcements WHERE id = ?', [annId]);

      }

    }

    res.json({ success: true, message: 'Holiday removed.' });

  } catch (err) {

    next(err);

  }

};



exports.removeGroup = async (req, res, next) => {

  try {

    const ids = (req.body.ids || []).map((x) => parseInt(x, 10)).filter(Boolean);

    if (!ids.length) {

      return res.status(400).json({ success: false, message: 'No holiday ids provided.' });

    }

    const placeholders = ids.map(() => '?').join(',');

    const [rows] = await pool.query(

      `SELECT DISTINCT announcement_id FROM school_holidays WHERE id IN (${placeholders}) AND announcement_id IS NOT NULL`,

      ids

    );

    await pool.query(`DELETE FROM school_holidays WHERE id IN (${placeholders})`, ids);

    for (const r of rows) {

      const [left] = await pool.query(

        'SELECT id FROM school_holidays WHERE announcement_id = ? LIMIT 1',

        [r.announcement_id]

      );

      if (!left.length) {

        await pool.query('DELETE FROM announcements WHERE id = ?', [r.announcement_id]);

      }

    }

    res.json({ success: true, message: 'Holiday(s) removed.' });

  } catch (err) {

    next(err);

  }

};


