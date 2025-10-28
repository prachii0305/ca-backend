const express = require('express');
const router = express.Router();
const passport = require('passport');
const Application = require('../models/Application');
const multer = require('multer');

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied' });
}

// Multer config for CV upload - using memory storage for Vercel compatibility
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOC, DOCX files
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Submit application
router.post('/', upload.single('resume'), async (req, res) => {
  console.log('Application submission request received');
  console.log('Body:', req.body);
  console.log('File:', req.file ? req.file.originalname : 'No file');

  const { name, email, phone, message } = req.body;
  try {
    const application = new Application({
      name,
      email,
      phone,
      message,
      resume: req.file ? req.file.originalname : null
    });
    await application.save();
    console.log('Application saved successfully');
    res.json({ msg: 'Application submitted successfully' });
  } catch (err) {
    console.error('Application submission error:', err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ msg: 'File too large. Maximum size is 10MB.' });
      }
    }
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get all applications (admin only)
router.get('/', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const applications = await Application.find().sort({ appliedAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete application (admin only)
router.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    await Application.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Application deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Serve resume file (admin only)
router.get('/resume/:filename', passport.authenticate('jwt', { session: false }), isAdmin, (req, res) => {
  // For Vercel, we can't serve files from disk, so return a message
  res.json({ msg: 'Resume download not available on Vercel deployment' });
});

module.exports = router;
