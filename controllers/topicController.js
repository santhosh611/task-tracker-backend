const asyncHandler = require('express-async-handler');
const Topic = require('../models/Topic');

// @desc    Get all topics
// @route   GET /api/topics
// @access  Private
const getTopics = asyncHandler(async (req, res) => {
  const topics = await Topic.find().sort({ department: 1, name: 1 });
  res.json(topics);
});

// @desc    Create new topic
// @route   POST /api/topics
// @access  Private/Admin
const createTopic = asyncHandler(async (req, res) => {
  const { name, points, department } = req.body;

  // Trim and validate name
  const trimmedName = name.trim();

  // Check for empty name
  if (!trimmedName) {
    res.status(400);
    throw new Error('Topic name cannot be empty');
  }

  // Case-insensitive check for existing topic
  const topicExists = await Topic.findOne({ 
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
  });

  if (topicExists) {
    res.status(400);
    throw new Error('A topic with this name already exists');
  }

  // Create topic with validated data
  const topic = await Topic.create({
    name: trimmedName,
    points: points || 0,
    department: department || 'all'
  });

  res.status(201).json(topic);
});

// @desc    Update a topic
// @route   PUT /api/topics/:id
// @access  Private/Admin
const updateTopic = asyncHandler(async (req, res) => {
  const { name, points, department } = req.body;

  const topic = await Topic.findById(req.params.id);

  if (!topic) {
    res.status(404);
    throw new Error('Topic not found');
  }

  topic.name = name || topic.name;
  topic.points = points !== undefined ? points : topic.points;
  topic.department = department || topic.department;

  const updatedTopic = await topic.save();
  res.json(updatedTopic);
});

// @desc    Delete a topic
// @route   DELETE /api/topics/:id
// @access  Private/Admin
const deleteTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id);

  if (!topic) {
    res.status(404);
    throw new Error('Topic not found');
  }

  await topic.deleteOne();
  res.json({ message: 'Topic removed' });
});

module.exports = {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic
};


