const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Worker = require('../models/Worker');
const Admin = require('../models/Admin');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    token = req.headers.authorization.split(' ')[1];
    
    // Decode token to check its contents
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded); // Check if role is included
    
    let user = await Admin.findById(decoded.id).select('-password');
    
    if (!user) {
      user = await Worker.findById(decoded.id).select('-password');
    }
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set user role properly
    req.user = user;
    req.user.role = decoded.role || (user instanceof Admin ? 'admin' : 'worker');
    
    console.log('User authenticated with role:', req.user.role);
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed', error: error.message }); 
  }
});

const roleCheck = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    console.log('User role check:', req.user.role, 'Required roles:', roles);
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};





const adminOnly = roleCheck(['admin']);
const workerOnly = roleCheck(['worker']);
const adminOrWorker = roleCheck(['admin', 'worker']);

module.exports = { protect, adminOnly, workerOnly, adminOrWorker };