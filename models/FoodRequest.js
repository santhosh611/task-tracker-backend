
const mongoose = require('mongoose');

const foodRequestSchema = mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true
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