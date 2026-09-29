const express = require('express');
const studentController = require('../controllers/studentController');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();
router.get('/students', verifyToken, authorize('admin'), studentController.search);

module.exports = router;
