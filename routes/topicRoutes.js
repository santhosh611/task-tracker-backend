const express = require('express');
const router = express.Router();
const { 
  getTopics, 
  createTopic, 
  updateTopic, 
  deleteTopic 
} = require('../controllers/topicController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/').post(protect, adminOnly, createTopic);
router.route('/all').post(protect, getTopics);

router.route('/:id')
  .put(protect, adminOnly, updateTopic)
  .delete(protect, adminOnly, deleteTopic);

module.exports = router;