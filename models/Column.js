const mongoose = require('mongoose');

const columnSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true
  },
  department: {
    type: String,
    default: 'all'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Column', columnSchema);