const Department = require('../models/Department');
const Worker = require('../models/Worker');
const asyncHandler = require('express-async-handler');

const createDepartment = asyncHandler(async (req, res) => {
  const { name } = req.body;

  console.log('Received Department Name:', name);

  // Validate input
  if (!name || name.trim().length < 2) {
    res.status(400);
    throw new Error('Department name must be at least 2 characters long');
  }

  try {
    // Create department with exact case preservation
    const department = new Department({ name: name });
    
    console.log('Department Before Save:', department);
    
    await department.save();
    
    console.log('Department After Save:', department);

    // Get worker count
    const workerCount = await Worker.countDocuments({ 
      department: department._id 
    });

    // Prepare response
    const departmentResponse = {
      ...department.toObject(),
      workerCount
    };

    console.log('Department Response:', departmentResponse);

    res.status(201).json(departmentResponse);
  } catch (error) {
    console.error('Department Creation Error:', error);
    throw error;
  }
});

const getDepartments = asyncHandler(async (req, res) => {
  try {
    // Find departments and sort by creation date (most recent first)
    const departments = await Department.find().sort({ createdAt: -1 });

    // Calculate worker count for each department
    const departmentsWithWorkerCount = await Promise.all(
      departments.map(async (department) => {
        const workerCount = await Worker.countDocuments({ 
          department: department._id 
        });

        return {
          _id: department._id,
          name: department.name, // This will preserve the original case
          createdAt: department.createdAt,
          workerCount
        };
      })
    );

    res.json(departmentsWithWorkerCount);
  } catch (error) {
    res.status(500);
    throw new Error('Failed to fetch departments');
  }
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check for associated workers
  const workerCount = await Worker.countDocuments({ 
    department: req.params.id 
  });

  if (workerCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete department. ${workerCount} workers are assigned.`);
  }

  await department.deleteOne();
  res.json({ 
    message: 'Department removed successfully',
    departmentId: req.params.id
  });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  // Validate input
  if (!name || name.trim().length < 2) {
    res.status(400);
    throw new Error('Department name must be at least 2 characters long');
  }

  try {
    // Check for existing department (case-insensitive)
    const existingDepartment = await Department.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      _id: { $ne: id } // Exclude current department
    });

    if (existingDepartment) {
      res.status(400);
      throw new Error('A department with this name already exists');
    }

    // Find the department and update with exact case
    const department = await Department.findById(id);
    
    if (!department) {
      res.status(404);
      throw new Error('Department not found');
    }

    department.name = name.trim();
    await department.save(); // Use save() to trigger validation

    // Get worker count
    const workerCount = await Worker.countDocuments({ 
      department: department._id 
    });

    // Prepare response
    const departmentResponse = {
      ...department.toObject(),
      workerCount
    };

    res.json(departmentResponse);
  } catch (error) {
    // Handle specific errors
    if (error.code === 11000) {
      res.status(400);
      throw new Error('A department with this name already exists');
    }
    
    // Rethrow other errors
    throw error;
  }
});

module.exports = {
  createDepartment,
  getDepartments,
  deleteDepartment,
  updateDepartment
};