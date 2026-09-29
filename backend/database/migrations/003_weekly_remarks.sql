USE nayab_sms;

CREATE TABLE IF NOT EXISTS student_weekly_remarks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  subject_id INT UNSIGNED NOT NULL,
  week_label VARCHAR(40) NOT NULL DEFAULT 'Weekly',
  remark ENUM('Work Hard', 'Satisfactory', 'Excellent', 'Super Excellent') NOT NULL,
  entered_by INT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_weekly_remark (student_id, subject_id, week_label),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;
