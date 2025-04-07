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
  const { name, points, department, subdomain } = req.body;

  // Check if topic exists
  const topicExists = await Topic.findOne({ name });

  if (topicExists) {
    res.status(400);
    throw new Error('Topic already exists');
  }

  // Create topic
  const topic = await Topic.create({
    name,
    points,
    department: department || 'all',
    subdomain
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


