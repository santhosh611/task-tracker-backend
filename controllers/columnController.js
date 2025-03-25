const asyncHandler = require('express-async-handler');
const Column = require('../models/Column');

// @desc    Get all columns
// @route   GET /api/columns
// @access  Private
const getColumns = asyncHandler(async (req, res) => {
  const columns = await Column.find().sort({ department: 1, name: 1 });
  res.json(columns);
});

// @desc    Create new column
// @route   POST /api/columns
// @access  Private/Admin
const createColumn = asyncHandler(async (req, res) => {
  const { name, department } = req.body;

  // Check if column exists
  const columnExists = await Column.findOne({ name });

  if (columnExists) {
    res.status(400);
    throw new Error('Column already exists');
  }

  // Create column
  const column = await Column.create({
    name,
    department: department || 'all'
  });

  res.status(201).json(column);
});

// @desc    Update a column
// @route   PUT /api/columns/:id
// @access  Private/Admin
const updateColumn = asyncHandler(async (req, res) => {
  const { name, department } = req.body;

  const column = await Column.findById(req.params.id);

  if (!column) {
    res.status(404);
    throw new Error('Column not found');
  }

  column.name = name || column.name;
  column.department = department || column.department;

  const updatedColumn = await column.save();
  res.json(updatedColumn);
});

// @desc    Delete a column
// @route   DELETE /api/columns/:id
// @access  Private/Admin
const deleteColumn = asyncHandler(async (req, res) => {
  const column = await Column.findById(req.params.id);

  if (!column) {
    res.status(404);
    throw new Error('Column not found');
  }

  await column.deleteOne();
  res.json({ message: 'Column removed' });
});

module.exports = {
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn
};