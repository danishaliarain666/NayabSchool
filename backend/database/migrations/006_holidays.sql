USE nayab_sms;

CREATE TABLE IF NOT EXISTS school_holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  holiday_date DATE NOT NULL,
  title VARCHAR(120) NOT NULL DEFAULT 'Holiday',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_holiday_date (holiday_date)
);
