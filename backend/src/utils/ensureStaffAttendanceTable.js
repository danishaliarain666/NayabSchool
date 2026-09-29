const pool = require('../config/db');

let done = false;

async function ensureStaffAttendanceTable() {
  if (done) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id INT NOT NULL,
      attendance_date DATE NOT NULL,
      status ENUM('present','absent','leave','half_day') NOT NULL DEFAULT 'present',
      remarks VARCHAR(255) NULL,
      updated_by INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_staff_att_date (teacher_id, attendance_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  done = true;
}

module.exports = { ensureStaffAttendanceTable };
