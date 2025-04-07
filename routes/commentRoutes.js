const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { 
  getWorkerComments, 
  getMyComments, 
  getAllComments, 
  createComment, 
  addReply, 
  markAdminRepliesAsRead,
  getUnreadAdminReplies,
  markCommentAsRead,
  getNewCommentCount,
  cleanupComments,
  markAllCommentsAsRead

} = require('../controllers/commentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');
const Worker = require('../models/Worker');

router.route('/')
  .get(protect, adminOnly, getAllComments)
  .post(protect, createComment);

  router.put('/mark-all-read', protect, adminOnly, asyncHandler(async (req, res) => {
    await Comment.updateMany(
      { isNew: true },
      { 
        isNew: false, 
        $set: { 
          'replies.$[].isNew': false 
        } 
      }
    );
    
    res.json({ message: 'All comments marked as read' });
  }));
  
router.get('/me', protect, getMyComments);
router.get('/worker/:workerId', protect, adminOnly, getWorkerComments);
router.post('/:id/replies', protect, addReply);
router.put('/:id/read', protect, markCommentAsRead);
router.get('/unread-admin-replies', protect, getUnreadAdminReplies);
router.put('/mark-admin-replies-read', protect, markAdminRepliesAsRead);
router.get('/new-count', protect, adminOnly, getNewCommentCount);
// Add cleanup route
router.post('/cleanup', protect, adminOnly, asyncHandler(async (req, res) => {
  // Fix any comments with missing worker references
  const comments = await Comment.find();
  let fixedCount = 0;
  
  for (const comment of comments) {
    const worker = await Worker.findById(comment.worker);
    if (!worker) {
      console.log(`Comment ${comment._id} has invalid worker reference`);
      
      // Find a valid worker to reassign
      const anyWorker = await Worker.findOne();
      if (anyWorker) {
        comment.worker = anyWorker._id;
        await comment.save();
        fixedCount++;
      }
    }
  }
  
  res.json({ message: `Fixed ${fixedCount} comments` });
}));

module.exports = router;