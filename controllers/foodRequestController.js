// backend/controllers/foodRequestController.js
const asyncHandler = require('express-async-handler');
const FoodRequest = require('../models/FoodRequest');
const Settings = require('../models/Settings');
const Worker = require('../models/Worker');

// Get all food requests for current day (admin)
const getTodayRequests = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const requests = await FoodRequest.find({
    date: {
      $gte: today,
      $lt: tomorrow
    }
  }).populate('worker', 'name employeeId department');
  
  res.status(200).json(requests);
});

// Submit a food request (worker)
const submitFoodRequest = asyncHandler(async (req, res) => {
  // Check if submissions are enabled
  const { subdomain } = req.params;

  if (!subdomain || subdomain == 'main') {
    res.status(400);
    throw new Error('Subdomain is required');
  }
  
  const settings = await Settings.findOne({ subdomain }) || await Settings.create({ subdomain });
  
  if (!settings.foodRequestEnabled) {
    res.status(400);
    throw new Error('Food requests are currently disabled');
  }
  
  // Check if worker has already submitted a request today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const existingRequest = await FoodRequest.findOne({
    worker: req.user._id,
    date: {
      $gte: today,
      $lt: tomorrow
    }
  });
  
  if (existingRequest) {
    res.status(400);
    throw new Error('You have already submitted a food request today');
  }
  
  // Create new request
  const request = await FoodRequest.create({
    worker: req.user._id,
    date: new Date()
  });
  
  res.status(201).json(request);
});

// Toggle food request submissions (admin)
const toggleFoodRequests = asyncHandler(async (req, res) => {
  const { subdomain } = req.params;

  if (!subdomain || subdomain == 'main') {
    res.status(400);
    throw new Error('Subdomain is required');
  }

  const settings = await Settings.findOne({ subdomain }) || await Settings.create({ subdomain });

  settings.foodRequestEnabled = !settings.foodRequestEnabled;
  settings.lastUpdated = new Date();
  settings.updatedBy = req.user._id;

  await settings.save();

  res.status(200).json({ enabled: settings.foodRequestEnabled });
});

// Get current settings status
const getSettings = asyncHandler(async (req, res) => {
  const { subdomain } = req.params;

  if (!subdomain || subdomain == 'main') {
    res.status(400);
    throw new Error('Subdomain is required');
  }

  const settings = await Settings.findOne({ subdomain });
  res.status(200).json({ enabled: settings.foodRequestEnabled });
});

module.exports = {
  getTodayRequests,
  submitFoodRequest,
  toggleFoodRequests,
  getSettings
};