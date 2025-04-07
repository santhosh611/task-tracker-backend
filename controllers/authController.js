// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const Worker = require('../models/Worker');

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Check subdomain availability
// @route   POST /api/auth/admin/subdomain-available
// @access  Public
const subdomainAvailable = asyncHandler(async (req, res) => {
  const { subdomain } = req.body;

  // Validate input
  if (!subdomain) {
    res.status(400).json({ available: false, message: 'Subdomain must be minium 5 characters' });
    throw new Error('Subdomain is required');
  }

  // Check subdomain length and allowed characters
  const isValidSubdomain = /^[a-zA-Z0-9-]{5,}$/.test(subdomain) && !subdomain.startsWith('-') && !subdomain.endsWith('-');
  if (!isValidSubdomain) {
    res.status(400);
    throw new Error('Subdomain must be at least 5 characters long and can only contain letters, numbers, and hyphens (-), but cannot start or end with a hyphen');
  }

  // Check if subdomain exists
  const subdomainExists = await Admin.findOne({ subdomain });

  if (subdomainExists) {
    res.json({ available: false, message: 'Subdomain is already taken' });
  } else {
    res.json({ available: true, message: 'Subdomain is available' });
  }
});

// @desc    Register a new admin
// @route   POST /api/auth/admin/register
// @access  Public
const registerAdmin = asyncHandler(async (req, res) => {
  const { username, subdomain, email, password } = req.body;

  // Validate input
  if (!username || !subdomain || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if admin already exists
  const adminExists = await Admin.findOne({ $or: [{ username }, { email }] });

  if (adminExists) {
    res.status(400);
    throw new Error('Admin already exists');
  }
  
  // check if subdomain exixts
  const subdomainExists = await Admin.findOne({ subdomain });

  if (subdomainExists) {
    res.status(400);
    throw new Error('Subdomain already exists');
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create admin
  const admin = await Admin.create({
    username,
    subdomain,
    email,
    password: hashedPassword,
    role: 'admin'
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      username: admin.username,
      subdomain: admin.subdomain,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id, 'admin')
    });
  } else {
    res.status(400);
    throw new Error('Invalid admin data');
  }
});

// @desc    Login admin
// @route   POST /api/auth/admin
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password, subdomain } = req.body;

  // Find admin and include password field
  const admin = await Admin.findOne({ username, subdomain }).select('+password');

  if (admin && (await bcrypt.compare(password, admin.password))) {
    res.json({
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      role: 'admin',
      organizationId: admin.organizationId,
      token: generateToken(admin._id, 'admin')
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc    Check admin initialization
// @route   GET /api/auth/check-admin
// @access  Public
const checkAdminInitialization = asyncHandler(async (req, res) => {
  const adminCount = await Admin.countDocuments();
  
  if (adminCount === 0) {
    res.json({ 
      needInitialAdmin: true,
      message: 'No admin exists. First admin can be created.'
    });
  } else {
    res.json({ 
      needInitialAdmin: false,
      message: 'Admins already exist.'
    });
  }
});


// @desc    Login worker
// @route   POST /api/auth/worker
// @access  Public
const loginWorker = asyncHandler(async (req, res) => {
  const { username, password, subdomain } = req.body;
  
  const worker = await Worker.findOne({ username, subdomain }).populate('department', 'name');

  if (!worker) {
    res.status(401);
    throw new Error("Worker not found, check your subdomain.");
  }
  
  if (worker && (await bcrypt.compare(password, worker.password))) {
    res.json({
      _id: worker._id,
      username: worker.username,
      name: worker.name,
      subdomain: worker.subdomain,
      rfid: worker.rfid ? worker.rfid : 'unassigned',
      department: worker.department ? worker.department.name : 'Unassigned',
      role: 'worker',
      token: generateToken(worker._id, 'worker')
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

module.exports = {
  subdomainAvailable,
  registerAdmin,
  loginAdmin,
  loginWorker,
  getMe,
  checkAdminInitialization
};