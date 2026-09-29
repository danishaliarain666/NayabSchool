require('./env');
const app = require('./app');
const { ensureStaffAttendanceTable } = require('./utils/ensureStaffAttendanceTable');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Nayab SMS Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  ensureStaffAttendanceTable()
    .then(() => console.log('Staff attendance table ready'))
    .catch((e) => console.warn('Staff attendance table setup:', e.message));
});
