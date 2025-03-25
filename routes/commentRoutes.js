const express = require('express');
const router = express.Router();
const { 
  getWorkerComments, 
  getMyComments, 
  getAllComments, 
  createComment, 
  addReply, 
  markAdminRepliesAsRead,
  getUnreadAdminReplies,
  markCommentAsRead 
} = require('../controllers/commentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getAllComments)
  .post(protect, createComment);

router.get('/me', protect, getMyComments);
router.get('/worker/:workerId', protect, adminOnly, getWorkerComments);
router.post('/:id/replies', protect, addReply);
router.put('/:id/read', protect, markCommentAsRead);
router.get('/unread-admin-replies', protect, getUnreadAdminReplies);
router.put('/mark-admin-replies-read', protect, markAdminRepliesAsRead);
module.exports = router;