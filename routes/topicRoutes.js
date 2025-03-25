const express = require('express');
const router = express.Router();
const { 
  getTopics, 
  createTopic, 
  updateTopic, 
  deleteTopic 
} = require('../controllers/topicController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTopics)
  .post(protect, adminOnly, createTopic);

router.route('/:id')
  .put(protect, adminOnly, updateTopic)
  .delete(protect, adminOnly, deleteTopic);

module.exports = router;