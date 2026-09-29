const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { loginRules, handleValidation } = require('../middleware/validate');

const router = express.Router();

router.post('/login', loginRules, handleValidation, authController.login);
router.get('/me', verifyToken, authController.me);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
