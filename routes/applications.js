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
  let resumeData = null;
  let resumeName = null;
  let resumeType = null;

  try {
    // Store file as base64 if present
    if (req.file) {
      resumeData = req.file.buffer.toString('base64');
      resumeName = req.file.originalname;
      resumeType = req.file.mimetype;
      console.log('Resume stored as base64, size:', resumeData.length);
    }

    const application = new Application({
      name,
      email,
      phone,
      message,
      resume: resumeData,
      resumeName,
      resumeType
    });
    await application.save();
    console.log('Application saved successfully');
    res.json({ msg: 'Application submitted successfully' });
  } catch (err) {
    console.error('Application submission error:', err);
    console.error('Error details:', err.stack);
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
router.get('/resume/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application || !application.resume) {
      return res.status(404).json({ msg: 'Resume not found' });
    }

    // Convert base64 back to buffer
    const fileBuffer = Buffer.from(application.resume, 'base64');

    // Set appropriate headers
    res.setHeader('Content-Type', application.resumeType);
    res.setHeader('Content-Disposition', `attachment; filename="${application.resumeName}"`);
    res.send(fileBuffer);
  } catch (err) {
    console.error('Resume download error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
