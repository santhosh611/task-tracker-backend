const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validation to ensure unique department names
departmentSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingDepartment = await this.constructor.findOne({ 
      name: this.name.toLowerCase().trim() 
    });

    if (existingDepartment && existingDepartment._id.toString() !== this._id.toString()) {
      const error = new Error('A department with this name already exists');
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Department', departmentSchema);