const express = require('express');
const { getLeavesByStatus } = require('../controllers/leaveController');
const router = express.Router();
const { 
  getLeaves, 
  getMyLeaves, 
  createLeave, 
  updateLeaveStatus, 
  markLeaveAsViewed,
  markLeavesAsViewedByAdmin, 
  getLeavesByDateRange,
  getNewLeaveRequestsCount
} = require('../controllers/leaveController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getLeaves)
  .post(protect, createLeave);

  // leaveRoutes.js


router.get('/me', protect, getMyLeaves);
router.get('/range', protect, adminOnly, getLeavesByDateRange);
router.get('/status', protect, adminOnly, getLeavesByStatus);
router.put('/:id/status', protect, adminOnly, updateLeaveStatus);
router.put('/:id/viewed', protect, markLeaveAsViewed);
router.put('/mark-viewed-by-admin', protect, adminOnly, markLeavesAsViewedByAdmin);
router.get('/new-requests-count', protect, adminOnly, getNewLeaveRequestsCount);
module.exports = router;