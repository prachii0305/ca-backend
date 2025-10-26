const express = require('express');
const router = express.Router();
const passport = require('passport');
const Application = require('../models/Application');
const multer = require('multer');
const path = require('path');

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied' });
}

// Multer config for CV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Submit application
router.post('/', upload.single('resume'), async (req, res) => {
  const { name, email, phone, message } = req.body;
  try {
    const application = new Application({
      name,
      email,
      phone,
      message,
      resume: req.file ? req.file.filename : null
    });
    await application.save();
    res.json({ msg: 'Application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
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
  const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(404).send('File not found');
    }
  });
});

module.exports = router;
