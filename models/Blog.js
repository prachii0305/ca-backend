const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: function() { return !this.fileData; } // Required if no file
  },
  fileData: {
    type: String, // Base64 encoded PDF data
    required: function() { return !this.content; } // Required if no content
  },
  fileName: {
    type: String, // Original filename
  },
  fileType: {
    type: String, // MIME type (e.g., 'application/pdf')
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Blog', BlogSchema);
