const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a topic name'],
    unique: true
  },
  points: {
    type: Number,
    required: [true, 'Please add points']
  },
  department: {
    type: String,
    default: 'all'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Topic', topicSchema);