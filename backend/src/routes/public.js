const express = require('express');
const publicController = require('../controllers/publicController');
const announcementController = require('../controllers/announcementController');
const portalController = require('../controllers/portalController');
const assistantController = require('../controllers/assistantController');
const { generateProspectus } = require('../utils/prospectus');
const { contactRules, handleValidation } = require('../middleware/validate');

const router = express.Router();

router.get('/home', publicController.getHome);
router.get('/about', publicController.getAbout);
router.get('/gallery', publicController.getGallery);
router.get('/announcements', announcementController.getPublic);
router.get('/news', publicController.getNews);
router.get('/contact-info', publicController.getContactInfo);
router.post('/contact', contactRules, handleValidation, publicController.submitContact);
router.post('/admissions', publicController.submitAdmission);
router.get('/prospectus', (req, res) => generateProspectus(res));

router.get('/portal/lookup', portalController.lookup);
router.get('/portal/classes', portalController.getClasses);
router.get('/portal/result-pdf', portalController.getResultPdf);
router.post('/assistant/chat', assistantController.chat);

module.exports = router;
