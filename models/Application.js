const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  resume: {
    type: String // base64 encoded file data
  },
  resumeName: {
    type: String // original filename
  },
  resumeType: {
    type: String // MIME type
  },
  message: {
    type: String
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', ApplicationSchema);
