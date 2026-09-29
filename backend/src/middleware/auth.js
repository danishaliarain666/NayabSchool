const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwtSecret');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  let decoded;
  try {
    const token = authHeader.split(' ')[1];
    decoded = jwt.verify(token, await getJwtSecret());
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
  req.user = decoded;
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access forbidden.' });
  }
  next();
};

module.exports = { verifyToken, authorize };
