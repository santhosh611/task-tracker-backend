const mongoose = require('mongoose');

const replySchema = mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please add text']
  },
  isAdminReply: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: true
  },
  subdomain: {
    type: String,
    required: [true, 'Subdomain is missing']
  }
}, {
  timestamps: true
});

const commentSchema = mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Worker'
  },
  subdomain: {
    type: String,
    required: [true, 'Subdomain is missing']
  },
  text: {
    type: String,
    required: [true, 'Please add text']
  },
  attachment: {
    name: String,
    type: String,
    data: String
  },
  replies: [replySchema],
  isNew: {
    type: Boolean,
    default: true
  },
  // New fields for admin reply tracking
  lastReplyTimestamp: {
    type: Date,
    default: null
  },
  hasUnreadAdminReply: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);