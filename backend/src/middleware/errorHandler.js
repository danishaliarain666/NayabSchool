const errorHandler = (err, req, res, next) => {
  console.error(err);
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  if (err.code === 'ECONNREFUSED' && (String(err.port) === '3306' || String(err.port) === '3307')) {
    status = 503;
    message = 'Database not running. Start XAMPP MySQL (port 3306) or RUN-WEBSITE.bat.';
  }
  res.status(status).json({
    success: false,
    message,
    errors: process.env.NODE_ENV === 'development' ? err.errors || undefined : undefined,
  });
};

module.exports = errorHandler;
