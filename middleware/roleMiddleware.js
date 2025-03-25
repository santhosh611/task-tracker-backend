// backend/middleware/roleMiddleware.js
const asyncHandler = require('express-async-handler');

const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized, admin access required');
  }
});

module.exports = { adminOnly };