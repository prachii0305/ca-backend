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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get paginated data
    const [pendingTimesheets, allTimesheets, stats] = await Promise.all([
      Timesheet.find({ status: 'pending' })
        .populate('user', 'name email')
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip),
      Timesheet.find()
        .populate('user', 'name email')
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip),
      // Use aggregation for stats to improve performance
      Promise.all([
        Timesheet.countDocuments(),
        Timesheet.countDocuments({ status: 'approved' }),
        Timesheet.countDocuments({ status: 'pending' }),
        Blog.countDocuments(),
        TeamMember.countDocuments(),
        Application.countDocuments(),
        Query.countDocuments()
      ]).then(([totalTimesheets, approvedTimesheets, pendingTimesheetsCount, blogs, teamMembers, applications, queries]) => ({
        totalTimesheets,
        approvedTimesheets,
        pendingTimesheetsCount,
        blogs,
        teamMembers,
        applications,
        queries
      }))
    ]);

    res.json({
      pendingTimesheets,
      allTimesheets,
      stats,
      pagination: {
        page,
        limit,
        total: stats.pendingTimesheetsCount // This is approximate for pagination info
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
