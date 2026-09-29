const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email or phone number required')
    .custom((v) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      const digits = String(v).replace(/\D/g, '');
      const isPhone = digits.length >= 10 && digits.length <= 13;
      if (!isEmail && !isPhone) throw new Error('Enter a valid email or mobile number');
      return true;
    }),
  body('password').notEmpty().withMessage('Password required'),
];

const studentRules = [
  body('student_id').notEmpty().withMessage('Student ID required'),
  body('full_name').notEmpty().withMessage('Full name required'),
  body('father_name').notEmpty().withMessage('Father name required'),
  body('class_id').notEmpty().withMessage('Class required'),
  body('roll_number').isInt({ min: 1 }).withMessage('Valid roll number required'),
];

const contactRules = [
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('message').notEmpty().withMessage('Message required'),
];

module.exports = { handleValidation, loginRules, studentRules, contactRules };
