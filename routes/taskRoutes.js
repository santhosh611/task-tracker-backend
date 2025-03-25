const express = require('express');
const router = express.Router();
const { 
  createTask, 
  getTasks, 
  getMyTasks, 
  getTasksByDateRange, 
  resetAllTasks 
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createTask)
  .get(protect, adminOnly, getTasks);

router.get('/me', protect, getMyTasks);
router.get('/range', protect, adminOnly, getTasksByDateRange);
router.delete('/reset', protect, adminOnly, resetAllTasks);

module.exports = router;