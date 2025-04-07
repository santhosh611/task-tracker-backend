const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Worker'
  },
  subdomain: {
    type: String,
    required: [true, 'Subdomain is missing']
  },
  data: {
    type: Object,
    default: {}
  },
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  points: {
    type: Number,
    default: 0
  },
  // New fields for custom tasks
  isCustom: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);