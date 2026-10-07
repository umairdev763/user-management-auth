const jwt = require('jsonwebtoken');
const { findById } = require('../models/userModel');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[process.env.COOKIE_NAME || 'auth_token'];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
