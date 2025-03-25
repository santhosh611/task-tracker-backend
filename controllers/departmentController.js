const Department = require('../models/Department');
const Worker = require('../models/Worker');
const asyncHandler = require('express-async-handler');

const createDepartment = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Validate input
  if (!name || name.trim().length < 2) {
    res.status(400);
    throw new Error('Department name must be at least 2 characters long');
  }

  try {
    // Check for existing department
    const existingDepartment = await Department.findOne({ 
      name: name.trim().toLowerCase() 
    });

    if (existingDepartment) {
      res.status(400);
      throw new Error('A department with this name already exists');
    }

    // Create department
    const department = await Department.create({
      name: name.trim().toLowerCase()
     
      
    });

    // Get worker count
    const workerCount = await Worker.countDocuments({ 
      department: department._id 
    });

    // Prepare response
    const departmentResponse = {
      ...department.toObject(),
      workerCount
    };

    res.status(201).json(departmentResponse);
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

const getDepartments = asyncHandler(async (req, res) => {
  try {
    const departments = await Department.aggregate([
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: 'department',
          as: 'workers'
        }
      },
      {
        $addFields: {
          workerCount: { $size: '$workers' }
        }
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          workerCount: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.json(departments);
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

module.exports = {
  createDepartment,
  getDepartments,
  deleteDepartment
};