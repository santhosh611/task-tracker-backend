const mongoose = require('mongoose');

const leaveSchema = mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Worker'
  },
  leaveType: {
    type: String,
    required: [true, 'Please add leave type'],
    enum: ['Annual Leave', 'Sick Leave', 'Personal Leave']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add end date']
  },
  totalDays: {
    type: Number,
    required: [true, 'Please add total days']
  },
  reason: {
    type: String,
    required: [true, 'Please add a reason']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  workerViewed: {
    type: Boolean,
    default: false
  },
  document: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Leave', leaveSchema);