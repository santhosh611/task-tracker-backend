
const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
  {
    foodRequestEnabled: {
      type: Boolean,
      default: true
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is missing']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);