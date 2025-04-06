const asyncHandler = require('express-async-handler');
const Worker = require('../models/Worker');
const Task = require('../models/Task');
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// Generate an unique RFID
const generateUniqueRFID = async () => {
  const generateRFID = () => {
    const letters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );
    const numbers = Math.floor(1000 + Math.random() * 9000).toString();
    return `${letters}${numbers}`;
  };

  let rfid;
  let isUnique = false;

  while (!isUnique) {
    rfid = generateRFID();
    const existingWorker = await Worker.findOne({ rfid });
    if (!existingWorker) {
      isUnique = true;
    }
  }

  return rfid;
};

// @desc    Create new worker
// @route   POST /api/workers
// @access  Private/Admin
const createWorker = asyncHandler(async (req, res) => {
  try {
    // Trim and validate name with extra checks
    const name = req.body.name && typeof req.body.name === 'string' 
      ? req.body.name.trim() 
      : '';
    const username = req.body.username ? req.body.username.trim() : '';
    const password = req.body.password ? req.body.password.trim() : '';
    const subdomain = req.body.subdomain ? req.body.subdomain.trim() : '';
    const email = req.body.email ? req.body.email.trim() : '';
    const department = req.body.department;
    const photo = req.file ? req.file.filename : '';

    const rfid = await generateUniqueRFID();
 
    // Comprehensive server-side validation
    if (!name || name.length === 0) {
      res.status(400);
      throw new Error('Name is required and cannot be empty');
    }
 
    if (!username) {
      res.status(400);
      throw new Error('Username is required and cannot be empty');
    }

    if (!subdomain) {
      res.status(400);
      throw new Error('Subdomain was missing, check the url');
    }
 
    if (!password) {
      res.status(400);
      throw new Error('Password is required and cannot be empty');
    }
 
    if (!department) {
      res.status(400);
      throw new Error('Department is required');
    }

    // Check if worker exists
    const emailExists = await Worker.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('Worker with this email already exists');
    }
 
    // Check if worker exists
    const workerExists = await Worker.findOne({ username });
    if (workerExists) {
      res.status(400);
      throw new Error('Worker with this username already exists');
    }
 
    // Validate department
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      res.status(400);
      throw new Error('Invalid department');
    }
 
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
 
    // Create worker
    const worker = await Worker.create({
      name,
      username,
      rfid,
      email,
      subdomain,
      password: hashedPassword,
      department: departmentDoc._id,
      photo: photo || '',
      totalPoints: 0
    });

    // Generate QR code for the RFID
    const qrCodeDataUrl = await QRCode.toDataURL(rfid);

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your email service provider
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Welcome to ${subdomain}!`,
      html: `
      <h1>Welcome to ${subdomain}, ${name}!</h1>
      <p>We are excited to have you on board. Below is your unique RFID QR code:</p>
      <p>Please keep this QR code safe as it will be used for identification purposes.</p>
      <p>Best regards,<br/>The ${subdomain} Team</p>
      `,
      attachments: [
      {
        filename: 'qr-code.png',
        content: qrCodeDataUrl.split('base64,')[1],
        encoding: 'base64',
        cid: 'qrCodeImage', // Content ID for inline image
      },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);
 
    res.status(201).json({
      _id: worker._id,
      name: worker.name,
      username: worker.username,
      rfid: worker.rfid,
      email: worker.email,
      subdomain: worker.subdomain,
      department: departmentDoc.name,
      photo: worker.photo
    });
 
  } catch (error) {
    console.error('Worker Creation Error:', error);
    res.status(400);
    throw new Error(error.message || 'Failed to create worker');
  }
 });

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private/Admin
const getWorkers = asyncHandler(async (req, res) => {
  try {
    const workers = await Worker.find({subdomain: req.body.subdomain})
      .select('-password')
      .populate('department', 'name');
    
    // Transform workers to include department name and full photo URL
    const transformedWorkers = workers.map(worker => ({
      ...worker.toObject(),
      department: worker.department ? worker.department.name : 'Unassigned',
      photoUrl: worker.photo 
        ? `/uploads/${worker.photo}` 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name)}`
    }));

    res.json(transformedWorkers);
  } catch (error) {
    console.error('Get Workers Error:', error);
    res.status(500);
    throw new Error('Failed to retrieve workers');
  }
});
const getPublicWorkers = asyncHandler(async (req, res) => {
  try {
    const workers = await Worker.find({ subdomain: req.body.subdomain })
      .select('name username subdomain department photo')
      .populate('department', 'name');
    
    const transformedWorkers = workers.map(worker => ({
      _id: worker._id,
      name: worker.name,
      username: worker.username,
      subdomain: worker.subdomain,
      department: worker.department ? worker.department.name : 'Unassigned',
      photo: worker.photo
    }));

    res.json(transformedWorkers);
  } catch (error) {
    console.error('Get Public Workers Error:', error);
    res.status(500);
    throw new Error('Failed to retrieve workers');
  }
});
// @desc    Get worker by ID
// @route   GET /api/workers/:id
// @access  Private
const getWorkerById = asyncHandler(async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .select('-password')
      .populate('department', 'name');
    
    if (!worker) {
      res.status(404);
      throw new Error('Worker not found');
    }

    res.json(worker);
  } catch (error) {
    console.error('Get Worker by ID Error:', error);
    res.status(404);
    throw new Error(error.message || 'Worker not found');
  }
});

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private/Admin
const updateWorker = asyncHandler(async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    
    if (!worker) {
      res.status(404);
      throw new Error('Worker not found');
    }

    const { name, username, department, password, photo } = req.body;
    const updateData = {};

    // Validate department if provided
    if (department) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        res.status(400);
        throw new Error('Invalid department');
      }
      updateData.department = department;
    }

    // Update fields
    if (name) updateData.name = name;
    if (username) {
      // Check if username is unique
      const usernameExists = await Worker.findOne({ 
        username, 
        _id: { $ne: req.params.id } 
      });
      if (usernameExists) {
        res.status(400);
        throw new Error('Username already exists');
      }
      updateData.username = username;
    }

    // Handle photo upload
    if (req.file) {
      updateData.photo = req.file.filename;
    }

    // Handle password update
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Update worker
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('department', 'name');

    res.json({
      _id: updatedWorker._id,
      name: updatedWorker.name,
      username: updatedWorker.username,
      department: updatedWorker.department.name,
      photo: updatedWorker.photo
    });
  } catch (error) {
    console.error('Update Worker Error:', error);
    res.status(400);
    throw new Error(error.message || 'Failed to update worker');
  }
});
// @desc    Delete worker
// @route   DELETE /api/workers/:id
// @access  Private/Admin
const deleteWorker = asyncHandler(async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    
    if (!worker) {
      res.status(404);
      throw new Error('Worker not found');
    }

    // Optional: Delete worker's photo file if exists
    if (worker.photo) {
      const photoPath = path.join(__dirname, '../uploads', worker.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await worker.deleteOne();
    res.json({ message: 'Worker removed successfully' });
  } catch (error) {
    console.error('Delete Worker Error:', error);
    res.status(400);
    throw new Error(error.message || 'Failed to delete worker');
  }
});

// @desc    Get worker activities
// @route   GET /api/workers/:id/activities
// @access  Private
const getWorkerActivities = asyncHandler(async (req, res) => {
  try {
    const tasks = await Task.find({ worker: req.params.id })
      .populate('topics', 'name points')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get Worker Activities Error:', error);
    res.status(500);
    throw new Error('Failed to retrieve worker activities');
  }
});

// @desc    Reset worker activities
// @route   DELETE /api/workers/:id/activities
// @access  Private/Admin
const resetWorkerActivities = asyncHandler(async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    
    if (!worker) {
      res.status(404);
      throw new Error('Worker not found');
    }

    // Delete all tasks for this worker
    await Task.deleteMany({ worker: req.params.id });
    
    // Reset worker points
    worker.totalPoints = 0;
    worker.topicPoints = {};
    worker.lastSubmission = {};
    await worker.save();

    res.json({ message: 'Worker activities reset successfully' });
  } catch (error) {
    console.error('Reset Worker Activities Error:', error);
    res.status(400);
    throw new Error(error.message || 'Failed to reset worker activities');
  }
});

// @desc    Get workers by department
// @route   GET /api/workers/department/:departmentId
// @access  Private/Admin
const getWorkersByDepartment = asyncHandler(async (req, res) => {
  try {
    const workers = await Worker.find({ department: req.params.departmentId })
      .select('-password')
      .populate('department', 'name');
    
    res.json(workers);
  } catch (error) {
    console.error('Get Workers by Department Error:', error);
    res.status(500);
    throw new Error('Failed to retrieve workers by department');
  }
});

module.exports = {
  getWorkers,
  createWorker,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getWorkerActivities,
  resetWorkerActivities,
  getWorkersByDepartment,
  getPublicWorkers  
};