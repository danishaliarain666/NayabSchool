USE nayab_sms;

CREATE TABLE IF NOT EXISTS staff_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present','absent','leave','half_day') NOT NULL DEFAULT 'present',
  remarks VARCHAR(255) NULL,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_staff_att_date (teacher_id, attendance_date),
  CONSTRAINT fk_staff_att_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);
