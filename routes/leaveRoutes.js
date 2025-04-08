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
  getLeavesByDateRange
} = require('../controllers/leaveController');
const { protect, adminOnly, adminOrWorker, workerOnly } = require('../middleware/authMiddleware');
const multer = require('multer'); 
const upload = multer({ dest: 'uploads/' });

router.route('/').post(protect, upload.single('document'), createLeave); 
router.route('/:subdomain/:me').get(protect, getLeaves)

router.get('/me', protect, workerOnly, getMyLeaves);
router.get('/range', protect, adminOnly, getLeavesByDateRange);
router.get('/status', protect, adminOnly, getLeavesByStatus);
router.put('/:id/status', protect, adminOnly, updateLeaveStatus);
router.put('/:id/viewed', protect, markLeaveAsViewed);
router.put('/mark-viewed-by-admin', protect, adminOnly, markLeavesAsViewedByAdmin);
module.exports = router;