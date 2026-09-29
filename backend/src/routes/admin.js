const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const dashboardController = require('../controllers/dashboardController');
const studentController = require('../controllers/studentController');
const teacherController = require('../controllers/teacherController');
const classController = require('../controllers/classController');
const attendanceController = require('../controllers/attendanceController');
const resultController = require('../controllers/resultController');
const weeklyRemarkController = require('../controllers/weeklyRemarkController');
const feeController = require('../controllers/feeController');
const subjectController = require('../controllers/subjectController');
const staffAttendanceController = require('../controllers/staffAttendanceController');
const holidayController = require('../controllers/holidayController');
const announcementController = require('../controllers/announcementController');
const publicController = require('../controllers/publicController');
const submissionController = require('../controllers/submissionController');
const { studentRules, handleValidation } = require('../middleware/validate');

const router = express.Router();
router.use(verifyToken, authorize('admin'));

router.get('/dashboard', dashboardController.getDashboard);
router.get('/notifications', dashboardController.getNotifications);

router.get('/students', studentController.getAll);
router.get('/students/export/excel', studentController.exportExcel);
router.get('/students/export/data-pdf', studentController.exportDataPdf);
router.get('/students/search', studentController.search);
router.get('/students/:id', studentController.getById);
router.post('/students', (req, res, next) => { req.uploadFolder = 'students'; next(); }, upload.single('photo'), studentRules, handleValidation, studentController.create);
router.put('/students/:id', (req, res, next) => { req.uploadFolder = 'students'; next(); }, upload.single('photo'), studentController.update);
router.delete('/students/:id', studentController.remove);
router.post('/students/promote-class', studentController.promoteClass);
router.get('/students/:id/leaving-certificate', studentController.leavingCertificate);

router.get('/teachers', teacherController.getAll);
router.get('/teachers/summary', teacherController.getSummary);
router.post('/teachers', (req, res, next) => { req.uploadFolder = 'teachers'; next(); }, upload.single('photo'), teacherController.create);
router.put('/teachers/:id', (req, res, next) => { req.uploadFolder = 'teachers'; next(); }, upload.single('photo'), teacherController.update);
router.patch('/teachers/:id/payroll', teacherController.patchPayroll);
router.put('/teachers/:id/login', teacherController.updateLogin);
router.delete('/teachers/:id', teacherController.remove);
router.get('/staff-attendance/summary', staffAttendanceController.getSummary);
router.get('/staff-attendance/export/pdf', staffAttendanceController.exportPdf);
router.get('/staff-attendance/range', staffAttendanceController.getRange);
router.get('/staff-attendance', staffAttendanceController.getByDate);
router.post('/staff-attendance', staffAttendanceController.saveBulk);
router.get('/holidays', holidayController.list);
router.post('/holidays', holidayController.create);
router.delete('/holidays/:id', holidayController.remove);
router.post('/holidays/remove-bulk', holidayController.removeGroup);

router.get('/subjects', subjectController.listByClass);
router.post('/subjects', subjectController.create);
router.put('/subjects/:id', subjectController.update);
router.delete('/subjects/:id', subjectController.remove);

router.get('/classes', classController.getAll);
router.post('/classes', classController.create);
router.put('/classes/:id', classController.update);
router.delete('/classes/:id', classController.remove);

router.get('/attendance', attendanceController.getReport);
router.get('/attendance/export/pdf', attendanceController.exportSummaryPdf);
router.get('/attendance/summary/students', attendanceController.getStudentSummary);
router.get('/attendance/:classId', attendanceController.getByClass);

router.get('/results', resultController.getAll);
router.get('/results/summary', resultController.getSummaries);
router.get('/results/student-detail', resultController.getStudentDetail);
router.get('/results/exams', resultController.getExams);
router.get('/results/subjects', resultController.getSubjects);
router.get('/results/export/pdf', resultController.exportPDF);
router.get('/results/export/bulk-pdf', resultController.bulkExportPDF);
router.post('/results/bulk', resultController.bulkCreate);
router.post('/results', resultController.create);
router.put('/results/:id', resultController.update);
router.get('/weekly-remarks', weeklyRemarkController.listRemarks);
router.post('/weekly-remarks', weeklyRemarkController.saveRemark);

router.get('/fees', feeController.getAll);
router.get('/fees/report', feeController.getReport);
router.get('/fees/export/pdf', feeController.exportPrintPdf);
router.post('/fees', feeController.create);
router.put('/fees/:id', feeController.update);
router.patch('/fees/:id/status', feeController.patchStatus);

router.get('/announcements', announcementController.getAll);
router.post('/announcements', announcementController.create);
router.put('/announcements/:id', announcementController.update);
router.delete('/announcements/:id', announcementController.remove);

router.get('/school-settings', publicController.getSchoolSettings);
router.put('/school-settings', publicController.updateSchoolSettings);
router.post('/school-settings/upload', (req, res, next) => { req.uploadFolder = 'branding'; next(); }, upload.single('file'), publicController.uploadBrandingFile);
router.get('/website-content', publicController.getWebsiteContent);
router.put('/website-content', publicController.updateWebsiteContent);
router.get('/gallery', publicController.manageGallery);
router.post('/gallery', (req, res, next) => { req.uploadFolder = 'gallery'; next(); }, upload.single('image'), publicController.addGallery);
router.delete('/gallery/:id', publicController.deleteGallery);

router.get('/submissions/contact', submissionController.getContactMessages);
router.put('/submissions/contact/:id/read', submissionController.markContactRead);
router.get('/submissions/admissions', submissionController.getAdmissionApplications);
router.put('/submissions/admissions/:id', submissionController.updateAdmissionStatus);

module.exports = router;
