const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Worker = require('../models/Worker');
const Topic = require('../models/Topic');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { data, topics, subdomain } = req.body;
  const workerId = req.user._id;

  // Validate task data
  if (!data || Object.keys(data).length === 0) {
    res.status(400);
    throw new Error('Please provide task data');
  }

  // Calculate task points
  let taskPoints = 0;
  
  // Sum values from the data object
  Object.values(data).forEach(value => {
    taskPoints += parseInt(value) || 0;
  });

  // Add points from topics
  let topicIds = [];
  let topicPoints = 0;
  
  if (topics && topics.length > 0) {
    const topicObjects = await Topic.find({ _id: { $in: topics }, subdomain });
    topicIds = topicObjects.map(topic => topic._id);
    
    topicPoints = topicObjects.reduce((sum, topic) => sum + topic.points, 0);
    taskPoints += topicPoints;
  }

  // Create task
  const task = await Task.create({
    worker: workerId,
    data,
    subdomain,
    topics: topicIds,
    points: taskPoints
  });

  // Update worker total points and last submission
  const worker = await Worker.findById(workerId);
  worker.totalPoints = (worker.totalPoints || 0) + taskPoints;
  worker.topicPoints = (worker.topicPoints || 0) + topicPoints;
  worker.lastSubmission = {
    timestamp: Date.now(),
    details: data
  };
  await worker.save();

  res.status(201).json(task);
});

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private/Admin
const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ subdomain: req.body.subdomain })
    .populate({
      path: 'worker',
      populate: {
        path: 'department',
        select: 'name'
      },
      select: 'name department'
    })
    .populate('topics', 'name points')
    .sort({ createdAt: -1 });

  res.json(tasks);
});
// @desc    Get my tasks
// @route   GET /api/tasks/me
// @access  Private
const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ worker: req.user._id })
    .populate('topics', 'name points')
    .sort({ createdAt: -1 });
  
  res.json(tasks);
});

// @desc    Get tasks by date range
// @route   GET /api/tasks/range
// @access  Private/Admin
const getTasksByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Please provide start and end dates');
  }

  const tasks = await Task.find({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
    .populate('worker', 'name department')
    .populate('topics', 'name points')
    .sort({ createdAt: -1 });
  
  res.json(tasks);
});

// @desc    Reset all tasks
// @route   DELETE /api/tasks/reset
// @access  Private/Admin
const resetAllTasks = asyncHandler(async (req, res) => {
  // Delete all tasks
  await Task.deleteMany({});
  
  // Reset all worker points
  await Worker.updateMany(
    {},
    { 
      $set: { 
        totalPoints: 0,
        topicPoints: 0,
        lastSubmission: {}
      }
    }
  );

  res.json({ message: 'All tasks reset successfully' });
});

const createCustomTask = asyncHandler(async (req, res) => {
  const { description } = req.body;
  const workerId = req.user._id;

  console.log('Creating custom task with workerId:', workerId);

  // Check if worker exists
  const workerExists = await Worker.findById(workerId);
  if (!workerExists) {
    console.log('Worker not found:', workerId);
    res.status(400);
    throw new Error('Worker not found');
  }

  const task = await Task.create({
    worker: workerId,
    description,
    isCustom: true,
    status: 'pending',
    points: 0
  });

  // Populate the worker information before returning
  const populatedTask = await Task.findById(task._id).populate({
    path: 'worker',
    select: 'name department',
    populate: {
      path: 'department',
      select: 'name'
    }
  });

  res.status(201).json(populatedTask);
});


const getCustomTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ isCustom: true })
    .populate({
      path: 'worker',
      select: 'name department',
      populate: {
        path: 'department',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 });
  
  // For debugging
  console.log('Populated tasks:', JSON.stringify(tasks.map(t => ({
    id: t._id,
    worker: t.worker ? { id: t.worker._id, name: t.worker.name } : null,
    description: t.description
  })), null, 2));
  
  res.json(tasks);
});

const getMyCustomTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ 
    worker: req.user._id,
    isCustom: true 
  }).sort({ createdAt: -1 });
  
  res.json(tasks);
});

const reviewCustomTask = asyncHandler(async (req, res) => {
  const { status, points } = req.body;
  const taskId = req.params.id;

  // Validate input
  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Please provide a valid status (approved or rejected)');
  }

  if (status === 'approved' && (!points || points < 0)) {
    res.status(400);
    throw new Error('Please provide valid points for approved task');
  }

  // Find task
  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (!task.isCustom) {
    res.status(400);
    throw new Error('This is not a custom task');
  }

  // Update task
  task.status = status;
  
  if (status === 'approved') {
    task.points = points;
    
    // Update worker's total points
    const worker = await Worker.findById(task.worker);
    worker.totalPoints = (worker.totalPoints || 0) + points;
    await worker.save();
  }

  await task.save();

  // Populate worker information before sending response
  const populatedTask = await Task.findById(task._id).populate({
    path: 'worker',
    select: 'name department',
    populate: {
      path: 'department',
      select: 'name'
    }
  });

  res.json(populatedTask);
});

module.exports = {
  createTask,
  getTasks,
  getMyTasks,
  getTasksByDateRange,
  resetAllTasks,
  createCustomTask,
  getCustomTasks,
  getMyCustomTasks,
  reviewCustomTask
};