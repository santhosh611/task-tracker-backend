const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');

// This route can be used for admin-specific operations that don't fit elsewhere
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard data' });
});
router.get('/admin-only', protect, adminOnly,);
module.exports = router;