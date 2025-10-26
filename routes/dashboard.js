const express = require('express');
const router = express.Router();
const passport = require('passport');
const Timesheet = require('../models/Timesheet');
const Blog = require('../models/Blog');
const TeamMember = require('../models/TeamMember');
const Application = require('../models/Application');
const Query = require('../models/Query');

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied' });
}

// User dashboard
router.get('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const timesheets = await Timesheet.find({ user: req.user.id }).sort({ date: -1 });
    res.json({ timesheets });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin dashboard
router.get('/admin', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const pendingTimesheets = await Timesheet.find({ status: 'pending' }).populate('user', 'name email');
    const allTimesheets = await Timesheet.find().populate('user', 'name email').sort({ date: -1 });
    const totalTimesheets = await Timesheet.countDocuments();
    const approvedTimesheets = await Timesheet.countDocuments({ status: 'approved' });
    const pendingTimesheetsCount = await Timesheet.countDocuments({ status: 'pending' });
    const blogs = await Blog.countDocuments();
    const teamMembers = await TeamMember.countDocuments();
    const applications = await Application.countDocuments();
    const queries = await Query.countDocuments();
    res.json({
      pendingTimesheets,
      allTimesheets,
      stats: {
        totalTimesheets,
        approvedTimesheets,
        pendingTimesheetsCount,
        blogs,
        teamMembers,
        applications,
        queries
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
