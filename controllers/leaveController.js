const asyncHandler = require('express-async-handler');
const Leave = require('../models/Leave');
const cloudinary = require('../config/cloudinary');

// @desc    Get all leave applications
// @route   GET /api/leaves
// @access  Private/Admin
const getLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find()
    .populate('worker', 'name department photo') // Add photo field
    .sort({ createdAt: -1 });

  res.json(leaves);
});

// @desc    Get my leave applications
// @route   GET /api/leaves/me
// @access  Private
const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ worker: req.user._id })
    .sort({ createdAt: -1 });
  
  res.json(leaves);
});

// @desc    Create a leave application
// @route   POST /api/leaves
// @access  Private
const createLeave = asyncHandler(async (req, res) => {
  console.log('Creating leave request with document');
  
  const { leaveType, startDate, endDate, totalDays, reason, document } = req.body;
  
  if (!leaveType || !startDate || !endDate || !totalDays || !reason) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }
  
  let documentUrl = null;
  
  // Upload base64 image to Cloudinary if present
  if (document && document.startsWith('data:image')) {
    console.log('Document is a base64 image, attempting Cloudinary upload');
    try {
      const uploadResponse = await cloudinary.uploader.upload(document, {
        folder: 'task-tracker/documents',
      });
      documentUrl = uploadResponse.secure_url;
      console.log('Cloudinary upload successful:', documentUrl);
    } catch (error) {
      console.error('Cloudinary upload error details:', error);
      res.status(500);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  } else if (document) {
    console.log('Document provided but not a base64 image');
  }
  
  try {
    console.log('Creating leave record in database');
    const leave = await Leave.create({
      worker: req.user._id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      document: documentUrl,
      status: 'Pending',
      workerViewed: false
    });
    
    console.log('Leave record created successfully:', leave._id);
    res.status(201).json(leave);
  } catch (dbError) {
    console.error('Database error while creating leave:', dbError);
    res.status(500);
    throw new Error(`Database error: ${dbError.message}`);
  }
});

// @desc    Update leave status (admin only)
// @route   PUT /api/leaves/:id/status
// @access  Private/Admin
const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    res.status(400);
    throw new Error('Please provide a valid status');
  }
  
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    res.status(404);
    throw new Error('Leave application not found');
  }

  leave.status = status;
  leave.workerViewed = false;

  const updatedLeave = await leave.save();

  res.json(updatedLeave);
});

// In leaveController.js
// In leaveController.js
const getLeavesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status && status !== 'all' ? { status } : {};
  
  const leaves = await Leave.find(query)
    .populate({
      path: 'worker',
      select: 'name department',
      populate: {
        path: 'department',
        select: 'name'
      }
    })
    .lean() // Convert to plain JavaScript object
    .sort({ createdAt: -1 });

  // Transform the data to ensure clean rendering
  const processedLeaves = leaves.map(leave => ({
    ...leave,
    worker: {
      ...leave.worker,
      department: leave.worker?.department 
        ? (typeof leave.worker.department === 'object' 
          ? leave.worker.department.name 
          : leave.worker.department)
        : 'No Department'
    }
  }));

  res.json(processedLeaves);
});
// @desc    Mark leave as viewed by worker
// @route   PUT /api/leaves/:id/viewed
// @access  Private
const markLeaveAsViewed = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  
  if (!leave) {
    res.status(404);
    throw new Error('Leave application not found');
  }
  
  // Ensure worker can only mark their own leave
  if (leave.worker.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to mark this leave as viewed');
  }
  
  leave.workerViewed = true;
  
  await leave.save();
  
  res.json({ message: 'Leave marked as viewed' });
});

// @desc    Get leave applications by date range
// @route   GET /api/leaves/range
// @access  Private/Admin
const getLeavesByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Please provide start and end dates');
  }
  
  const leaves = await Leave.find({
    $or: [
      {
        startDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      },
      {
        endDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    ]
  })
    .populate('worker', 'name department photo') // Add photo field
    .sort({ createdAt: -1 });
  
  res.json(leaves);
});

const markLeavesAsViewedByAdmin = asyncHandler(async (req, res) => {
  await Leave.updateMany(
    { 
      workerViewed: false 
    },
    { 
      workerViewed: true 
    }
  );
  
  res.json({ message: 'All leaves marked as viewed by admin' });
});

const getNewLeaveRequestsCount = asyncHandler(async (req, res) => {
  const newLeaveRequestsCount = await Leave.countDocuments({ 
    status: 'Pending', 
    workerViewed: false 
  });
  
  res.json({ count: newLeaveRequestsCount });
});

module.exports = {
  getLeaves,
  getMyLeaves,
  createLeave,
  updateLeaveStatus,
  getLeavesByStatus,
  markLeaveAsViewed,
  markLeavesAsViewedByAdmin,
  getLeavesByDateRange,
  getNewLeaveRequestsCount
};