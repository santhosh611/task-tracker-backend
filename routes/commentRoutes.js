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
const { protect, adminOnly, adminOrWorker } = require('../middleware/authMiddleware');

router.route('/').post(protect, createComment);
router.route('/:subdomain').get(protect, adminOnly, getAllComments)

router.get('/me', protect, getMyComments);
router.get('/worker/:workerId', protect, adminOnly, getWorkerComments);
router.post('/:id/replies', protect, addReply);
router.put('/:id/read', protect, markCommentAsRead);
router.get('/unread-admin-replies', protect, getUnreadAdminReplies);
router.put('/mark-admin-replies-read', protect, markAdminRepliesAsRead);
module.exports = router;