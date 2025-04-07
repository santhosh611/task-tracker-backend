const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { putAttendance, getAttendance, getWorkerAttendance } = require('../controllers/attendanceController');

const router = express.Router();

router.put('/', protect, putAttendance);
router.post('/', protect, getAttendance);
router.post('/worker', protect, getWorkerAttendance);

module.exports = router;