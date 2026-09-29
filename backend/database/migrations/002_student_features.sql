-- Migration: student records, fee tiers, teacher schedules, leaving certificates
USE nayab_sms;

ALTER TABLE gallery MODIFY image_url TEXT NOT NULL;
ALTER TABLE news MODIFY image_url TEXT NULL;

CREATE TABLE IF NOT EXISTS fee_tiers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  class_pattern VARCHAR(80) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(200) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_leaving_certificates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  certificate_no VARCHAR(40) NOT NULL UNIQUE,
  reason VARCHAR(255) NULL,
  issued_date DATE NOT NULL,
  issued_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teacher_schedules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT UNSIGNED NOT NULL,
  class_id INT UNSIGNED NOT NULL,
  day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject VARCHAR(80) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS promotion_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  from_class_id INT UNSIGNED NOT NULL,
  to_class_id INT UNSIGNED NULL,
  academic_year VARCHAR(9) NOT NULL,
  promoted_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO fee_tiers (class_pattern, monthly_amount, description) VALUES
('Nursery|KG1|Play Group', 2000, 'Nursery to KG1'),
('KG2|1st|2nd|3rd|4th|5th|6th|7th|8th', 1800, 'KG2 to Class 8'),
('9th|10th', 2500, 'Class 9 and 10');
