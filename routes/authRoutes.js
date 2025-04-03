// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
  registerAdmin, 
  loginAdmin, 
  loginWorker,
  getMe,
  checkAdminInitialization, 
  subdomainAvailable,
  
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Subdomain avalability
router.post('/admin/subdomain-available', subdomainAvailable);

// Admin registration and login
router.post('/admin/register', registerAdmin);
router.post('/admin', loginAdmin);
router.post('/worker', loginWorker);

// Check admin initialization
router.get('/check-admin', checkAdminInitialization);

// Protected route to get current admin info
router.get('/me', protect, getMe);

module.exports = router;