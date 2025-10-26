const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true, // e.g., 'about', 'services'
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Content', ContentSchema);
