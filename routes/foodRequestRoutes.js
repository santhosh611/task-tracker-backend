// backend/routes/foodRequestRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getTodayRequests, 
  submitFoodRequest, 
  toggleFoodRequests,
  getSettings
} = require('../controllers/foodRequestController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// Worker routes
router.post('/', protect, submitFoodRequest);

// Admin routes
router.get('/:subdomain', protect, adminOnly, getTodayRequests);
router.put('/toggle/:subdomain', protect, adminOnly, toggleFoodRequests);
router.get('/settings/:subdomain', protect, getSettings);

module.exports = router;