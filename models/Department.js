const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    
  },
  subdomain: {
    type: String,
    required: [true, 'Subdomain is missing'],
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

departmentSchema.pre('save', async function(next) {
  console.log('Pre-save Hook - Original Name:', this.name);
  
  if (this.isModified('name')) {
    // Remove any automatic transformations
    this.name = this.name.trim();
    
    console.log('Pre-save Hook - Processed Name:', this.name);

    const existingDepartment = await this.constructor.findOne({ 
      name: this.name
    });

    if (existingDepartment && existingDepartment._id.toString() !== this._id.toString()) {
      const error = new Error('A department with this name already exists');
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Department', departmentSchema);