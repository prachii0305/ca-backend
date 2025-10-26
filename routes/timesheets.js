const express = require('express');
const router = express.Router();
const passport = require('passport');
const Timesheet = require('../models/Timesheet');

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied' });
}

// Get user's timesheets
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const timesheets = await Timesheet.find({ user: req.user.id }).sort({ date: -1 });
    res.json(timesheets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Submit timesheet
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { date, hours, description } = req.body;
  try {
    const timesheet = new Timesheet({
      user: req.user.id,
      date,
      hours,
      description
    });
    await timesheet.save();
    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all timesheets (admin only)
router.get('/all', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const timesheets = await Timesheet.find().populate('user', 'name email').sort({ submittedAt: -1 });
    res.json(timesheets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Approve/Reject timesheet (admin only)
router.put('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    if (!timesheet) {
      return res.status(404).json({ msg: 'Timesheet not found' });
    }
    timesheet.status = status;
    timesheet.reviewedAt = Date.now();
    timesheet.reviewedBy = req.user.id;
    await timesheet.save();
    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
