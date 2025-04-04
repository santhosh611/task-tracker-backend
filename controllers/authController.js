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

// @desc    Register a new admin
// @route   POST /api/auth/admin/register
// @access  Public
const registerAdmin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if admin already exists
  const adminExists = await Admin.findOne({ $or: [{ username }, { email }] });

  if (adminExists) {
    res.status(400);
    throw new Error('Admin already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create admin
  const admin = await Admin.create({
    username,
    email,
    password: hashedPassword,
    role: 'admin'
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      username: admin.username,
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
  const { username, password } = req.body;

  // Find admin and include password field
  const admin = await Admin.findOne({ username }).select('+password');

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
  const { username, password } = req.body;
  
  const worker = await Worker.findOne({ username }).populate('department', 'name');
  
  if (worker && (await bcrypt.compare(password, worker.password))) {
    res.json({
      _id: worker._id,
      username: worker.username,
      name: worker.name, // Full name
      department: worker.department ? worker.department.name : 'Unassigned', // Department name
      role: 'worker',
      token: generateToken(worker._id, 'worker')
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

const refreshToken = asyncHandler(async (req, res) => {
  try {
    // Extract token from authorization header
    const token = req.headers.authorization.split(' ')[1];
    
    // Verify token (ignoring expiration)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    // We need to determine if this is an admin or worker
    let user;
    let userRole = decoded.role; // Get role from token
    
    // If we can't get role from token, check request body
    if (!userRole && req.body && req.body.role) {
      userRole = req.body.role;
    }
    
    // Find user based on role information
    if (userRole === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Admin not found' });
      }
    } else {
      user = await Worker.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Worker not found' });
      }
    }
    
    // Generate new token with explicit role
    const newToken = generateToken(user._id, userRole);
    
    // Return new token and user data
    res.json({
      token: newToken,
      user: {
        _id: user._id,
        name: user.name || user.username,
        username: user.username,
        email: user.email,
        role: userRole,
        ...(userRole === 'worker' && user.department && { department: user.department.name })
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Token refresh failed' });
  }
});


module.exports = {
  registerAdmin,
  loginAdmin,
  loginWorker,
  getMe,
  checkAdminInitialization,
  refreshToken
};