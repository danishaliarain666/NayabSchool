-- Nayab School Management System schema (converted from MySQL)

CREATE TABLE IF NOT EXISTS admission_applications (
  id SERIAL PRIMARY KEY,
  student_name VARCHAR(120) NOT NULL,
  father_name VARCHAR(120) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(40) NOT NULL,
  applying_class VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  previous_school VARCHAR(200) DEFAULT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'general',
  is_published SMALLINT NOT NULL DEFAULT '1',
  publish_date DATE NOT NULL,
  expiry_date DATE DEFAULT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'absent',
  marked_by INTEGER NOT NULL,
  remarks VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_uq_att_key UNIQUE (student_id,date)
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  section VARCHAR(10) NOT NULL DEFAULT 'A',
  academic_year VARCHAR(9) NOT NULL,
  class_teacher_id INTEGER DEFAULT NULL,
  capacity INTEGER NOT NULL DEFAULT '40',
  is_active SMALLINT NOT NULL DEFAULT '1',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT classes_uq_class_key UNIQUE (name,section,academic_year)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  subject VARCHAR(200) DEFAULT NULL,
  message TEXT NOT NULL,
  is_read SMALLINT NOT NULL DEFAULT '0',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  academic_year VARCHAR(9) NOT NULL,
  class_id INTEGER NOT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  is_published SMALLINT NOT NULL DEFAULT '0',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_tiers (
  id SERIAL PRIMARY KEY,
  class_pattern VARCHAR(80) NOT NULL,
  monthly_amount NUMERIC(10,2) NOT NULL,
  description VARCHAR(200) DEFAULT NULL,
  is_active SMALLINT NOT NULL DEFAULT '1'
);

CREATE TABLE IF NOT EXISTS fees (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  fee_type VARCHAR(50) NOT NULL DEFAULT 'Monthly Fee',
  amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT '0.00',
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_date DATE DEFAULT NULL,
  academic_year VARCHAR(9) NOT NULL,
  remarks VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category VARCHAR(40) NOT NULL,
  is_featured SMALLINT NOT NULL DEFAULT '0',
  is_active SMALLINT NOT NULL DEFAULT '1',
  uploaded_by INTEGER DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  is_published SMALLINT NOT NULL DEFAULT '1',
  publish_date DATE NOT NULL,
  created_by INTEGER DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'info',
  is_read SMALLINT NOT NULL DEFAULT '0',
  link VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_logs (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  from_class_id INTEGER NOT NULL,
  to_class_id INTEGER DEFAULT NULL,
  academic_year VARCHAR(9) NOT NULL,
  promoted_by INTEGER DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  exam_id INTEGER NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT '100.00',
  percentage NUMERIC(5,2) NOT NULL,
  grade VARCHAR(5) NOT NULL,
  entered_by INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT results_uq_result_key UNIQUE (student_id,subject_id,exam_id)
);

CREATE TABLE IF NOT EXISTS school_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(80) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT school_settings_setting_key_key UNIQUE (setting_key)
);

CREATE TABLE IF NOT EXISTS student_leaving_certificates (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  certificate_no VARCHAR(40) NOT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  issued_date DATE NOT NULL,
  issued_by INTEGER DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_leaving_certificates_certificate_no_key UNIQUE (certificate_no)
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  roll_number INTEGER NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  father_name VARCHAR(120) NOT NULL,
  gender VARCHAR(40) NOT NULL,
  date_of_birth DATE NOT NULL,
  class_id INTEGER NOT NULL,
  section VARCHAR(10) NOT NULL DEFAULT 'A',
  address TEXT,
  phone VARCHAR(20) DEFAULT NULL,
  admission_date DATE NOT NULL,
  fee_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  photo VARCHAR(255) DEFAULT NULL,
  is_active SMALLINT NOT NULL DEFAULT '1',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT students_student_id_key UNIQUE (student_id),
  CONSTRAINT students_uq_roll_class_key UNIQUE (roll_number,class_id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  class_id INTEGER NOT NULL,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT '100.00',
  is_active SMALLINT NOT NULL DEFAULT '1',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subjects_uq_subject_key UNIQUE (name,class_id)
);

CREATE TABLE IF NOT EXISTS teacher_schedules (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  day_of_week VARCHAR(40) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject VARCHAR(80) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  father_name VARCHAR(120) DEFAULT NULL,
  gender VARCHAR(40) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  email VARCHAR(120) DEFAULT NULL,
  qualification VARCHAR(120) DEFAULT NULL,
  subject VARCHAR(80) DEFAULT NULL,
  joining_date DATE DEFAULT NULL,
  photo VARCHAR(255) DEFAULT NULL,
  address TEXT,
  is_active SMALLINT NOT NULL DEFAULT '1',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monthly_salary NUMERIC(10,2) NOT NULL DEFAULT '30000.00',
  bank_account VARCHAR(32) DEFAULT NULL,
  designation VARCHAR(80) DEFAULT NULL,
  salary_paid VARCHAR(40) NOT NULL DEFAULT 'unpaid',
  CONSTRAINT teachers_employee_id_key UNIQUE (employee_id)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL,
  teacher_id INTEGER DEFAULT NULL,
  is_active SMALLINT NOT NULL DEFAULT '1',
  last_login TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  phone VARCHAR(20) DEFAULT NULL,
  CONSTRAINT users_username_key UNIQUE (username),
  CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS website_content (
  id SERIAL PRIMARY KEY,
  page_key VARCHAR(50) NOT NULL,
  section_key VARCHAR(50) NOT NULL,
  title VARCHAR(200) DEFAULT NULL,
  content TEXT,
  image_url VARCHAR(255) DEFAULT NULL,
  sort_order INTEGER NOT NULL DEFAULT '0',
  is_active SMALLINT NOT NULL DEFAULT '1',
  updated_by INTEGER DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT website_content_uq_content_key UNIQUE (page_key,section_key)
);

CREATE TABLE IF NOT EXISTS student_weekly_remarks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  week_label VARCHAR(40) NOT NULL DEFAULT 'Weekly',
  remark VARCHAR(40) NOT NULL,
  entered_by INTEGER DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_weekly_remarks_uq_key UNIQUE (student_id, subject_id, week_label)
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'present',
  remarks VARCHAR(255) DEFAULT NULL,
  updated_by INTEGER DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT staff_attendance_uq_key UNIQUE (teacher_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS school_holidays (
  id SERIAL PRIMARY KEY,
  holiday_date DATE NOT NULL,
  title VARCHAR(120) NOT NULL DEFAULT 'Holiday',
  announcement_id INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT school_holidays_date_key UNIQUE (holiday_date)
);

CREATE INDEX IF NOT EXISTS students_class_id_idx ON students (class_id);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance (date);
CREATE INDEX IF NOT EXISTS results_exam_id_idx ON results (exam_id);
CREATE INDEX IF NOT EXISTS fees_student_id_idx ON fees (student_id);

-- Mirror MySQL's "ON UPDATE CURRENT_TIMESTAMP" behaviour
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER announcements_set_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER classes_set_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER fees_set_updated_at BEFORE UPDATE ON fees FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER results_set_updated_at BEFORE UPDATE ON results FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER school_settings_set_updated_at BEFORE UPDATE ON school_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER students_set_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER teachers_set_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER website_content_set_updated_at BEFORE UPDATE ON website_content FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER student_weekly_remarks_set_updated_at BEFORE UPDATE ON student_weekly_remarks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER staff_attendance_set_updated_at BEFORE UPDATE ON staff_attendance FOR EACH ROW EXECUTE FUNCTION set_updated_at();
