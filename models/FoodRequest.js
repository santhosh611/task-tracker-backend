
const mongoose = require('mongoose');

const foodRequestSchema = mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is missing']
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department not found']
    },
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['fulfilled', 'cancelled'],
      default: 'fulfilled'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodRequest', foodRequestSchema);