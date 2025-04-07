const express = require('express');
const router = express.Router();
const { 
  createTask, 
  getTasks, 
  getMyTasks, 
  getTasksByDateRange, 
  resetAllTasks,
  createCustomTask,
  getCustomTasks,
  getMyCustomTasks,
  reviewCustomTask 

} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/').post(protect, createTask)
router.route('/all').post(protect, adminOnly, getTasks);

router.get('/me', protect, getMyTasks);
router.get('/range', protect, adminOnly, getTasksByDateRange);
router.delete('/reset/:subdomain', protect, adminOnly, resetAllTasks);

// Custom task routes
router.post('/custom', protect, createCustomTask);
router.get('/custom/:subdomain', protect, adminOnly, getCustomTasks);
router.get('/custom/me', protect, getMyCustomTasks);
router.put('/custom/:id', protect, adminOnly, reviewCustomTask);

module.exports = router;