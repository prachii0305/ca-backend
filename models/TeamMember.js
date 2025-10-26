const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  bio: {
    type: String
  },
  image: {
    type: String // path to image
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  order: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
