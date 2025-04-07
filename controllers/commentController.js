const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const Worker = require('../models/Worker');

// @desc    Get comments for a worker
// @route   GET /api/comments/worker/:workerId
// @access  Private
const getWorkerComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ worker: req.params.workerId })
    .sort({ createdAt: -1 });
  
  res.json(comments);
});

// @desc    Get my comments
// @route   GET /api/comments/me
// @access  Private
const getMyComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ worker: req.user._id })
    .sort({ createdAt: -1 });
  
  // Mark all comments and replies as read
  for (const comment of comments) {
    comment.isNew = false;
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => {
        reply.isNew = false;
      });
    }
    await comment.save();
  }
  
  res.json(comments);
});

// @desc    Get all comments (admin)
// @route   GET /api/comments
// @access  Private/Admin
const getAllComments = asyncHandler(async (req, res) => {
  try {
    console.log('Admin requesting all comments');
    
    // First get all comments
    const allComments = await Comment.find()
      .populate({
        path: 'worker',
        populate: {
          path: 'department',
          select: 'name' 
        },
        select: 'name department photo username'
      })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${allComments.length} total comments`);
    
    // Process and send back all comments, with placeholders for missing worker info
    const processedComments = allComments.map(comment => {
      // Convert to plain object
      const commentObj = comment.toObject();
      
      // Add placeholder worker info if missing
      if (!commentObj.worker) {
        commentObj.worker = {
          name: 'Unknown Worker',
          department: { name: 'Unassigned' },
          _id: comment.worker || 'unknown'
        };
      }
      
      return commentObj;
    });
    
    res.json(processedComments);
  } catch (error) {
    console.error('Error in getAllComments:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
});

// @desc    Create new comment
// @route   POST /api/comments
// @access  Private
const createComment = asyncHandler(async (req, res) => {
  try {
    const { text } = req.body;
    const workerId = req.user._id;

    // Validate input
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Log information for debugging
    console.log('Creating comment with data:', { text, workerId });
    
    // Verify the worker exists
    const worker = await Worker.findById(workerId);
    if (!worker) {
      console.log('Worker not found with ID:', workerId);
      return res.status(404).json({ message: 'Worker not found' });
    }

    const comment = await Comment.create({
      worker: workerId,
      text
    });

    // Populate worker details
    const populatedComment = await Comment.findById(comment._id).populate({
      path: 'worker',
      populate: {
        path: 'department',
        select: 'name'
      },
      select: 'name department photo'
    });

    console.log('Comment Created Successfully:', populatedComment);

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Comment Creation Error:', error);
    res.status(500).json({ message: 'Failed to create comment', error: error.message });
  }
});

// @desc    Add reply to comment
// @route   POST /api/comments/:id/replies
// @access  Private
const addReply = asyncHandler(async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    res.status(400);
    throw new Error('Please add text to your reply');
  }
  
  try {
    // Find the comment with populated worker
    const comment = await Comment.findById(req.params.id)
      .populate({
        path: 'worker',
        populate: {
          path: 'department',
          select: 'name'
        },
        select: 'name department photo username'
      });
    
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    
    // Create new reply
    const newReply = {
      text,
      isAdminReply: req.user.role === 'admin',
      isNew: true,
      createdAt: new Date() // Explicitly set creation time
    };
    
    // Add reply to comment
    comment.replies = comment.replies || [];
    comment.replies.push(newReply);
    
    // If admin reply, set notification flag
    if (req.user.role === 'admin') {
      comment.hasUnreadAdminReply = true;
      comment.lastReplyTimestamp = new Date();
    }
    
    comment.isNew = true;
    
    await comment.save();
    
    // Return the already populated comment to avoid extra DB query
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Failed to add reply', error: error.message });
  }
});

// @desc    Mark comment as read
// @route   PUT /api/comments/:id/read
// @access  Private
const markCommentAsRead = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  
  comment.isNew = false;
  
  if (comment.replies && comment.replies.length > 0) {
    comment.replies.forEach(reply => {
      reply.isNew = false;
    });
  }
  
  await comment.save();
  
  res.json({ message: 'Comment marked as read' });
});

// @desc    Get unread admin replies (for worker)
// @route   GET /api/comments/unread-admin-replies
// @access  Private
const getUnreadAdminReplies = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ 
    worker: req.user._id, 
    hasUnreadAdminReply: true 
  });
  
  res.json(comments);
});

// @desc    Mark admin replies as read
// @route   PUT /api/comments/mark-admin-replies-read
// @access  Private
const markAdminRepliesAsRead = asyncHandler(async (req, res) => {
  await Comment.updateMany(
    { 
      worker: req.user._id, 
      hasUnreadAdminReply: true 
    },
    { 
      hasUnreadAdminReply: false 
    }
  );
  
  res.json({ message: 'Admin replies marked as read' });
});

// @desc    Clean up invalid worker references in comments
// @route   POST /api/comments/cleanup
// @access  Private/Admin
const cleanupComments = asyncHandler(async (req, res) => {
  try {
    // Find all comments
    const comments = await Comment.find();
    
    let updatedCount = 0;
    let deletedCount = 0;
    
    for (const comment of comments) {
      // Check if the worker exists
      const workerExists = await Worker.findById(comment.worker);
      
      if (!workerExists) {
        console.log(`Comment ${comment._id} has invalid worker reference: ${comment.worker}`);
        
        // Find any valid worker to use instead
        const anyWorker = await Worker.findOne();
        
        if (anyWorker) {
          comment.worker = anyWorker._id;
          await comment.save();
          updatedCount++;
          console.log(`Reassigned to worker: ${anyWorker._id}`);
        } else {
          // If no workers at all, delete the comment as it can't be reassigned
          await Comment.deleteOne({ _id: comment._id });
          deletedCount++;
          console.log(`Deleted comment: ${comment._id}`);
        }
      }
    }
    
    res.json({ 
      message: `Cleanup complete. Updated ${updatedCount} comments, deleted ${deletedCount} comments.` 
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ message: 'Cleanup failed', error: error.message });
  }
});
const getNewCommentCount = asyncHandler(async (req, res) => {
  try {
    const newCommentCount = await Comment.countDocuments({ 
      isNew: true,
      status: { $ne: 'read' },
      // Exclude comments with admin replies
      $or: [
        { 'replies': { $not: { $elemMatch: { isAdminReply: true } } } },
        { 'replies': { $size: 0 } }
      ]
    });

    const newReplyCount = await Comment.aggregate([
      { $unwind: '$replies' },
      { $match: { 
        'replies.isNew': true,
        'replies.isAdminReply': { $ne: true } 
      } },
      { $count: 'newReplyCount' }
    ]);

    const totalNewCount = newCommentCount + (newReplyCount[0]?.newReplyCount || 0);

    res.json({ 
      newCommentCount, 
      newReplyCount: newReplyCount[0]?.newReplyCount || 0, 
      totalNewCount 
    });
  } catch (error) {
    console.error('Error getting new comment count:', error);
    res.status(500).json({ message: 'Failed to get new comment count', error: error.message });
  }
});

module.exports = {
  getWorkerComments,
  getMyComments,
  getAllComments,
  createComment,
  addReply,
  markAdminRepliesAsRead,
  getUnreadAdminReplies,
  markCommentAsRead,
  cleanupComments,
  getNewCommentCount
};