USE nayab_sms;

ALTER TABLE teachers ADD COLUMN monthly_salary DECIMAL(10,2) NOT NULL DEFAULT 30000;
ALTER TABLE teachers ADD COLUMN bank_account VARCHAR(32) NULL;
ALTER TABLE teachers ADD COLUMN designation VARCHAR(80) NULL;
ALTER TABLE teachers ADD COLUMN salary_paid ENUM('paid','unpaid') NOT NULL DEFAULT 'unpaid';
ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL;
