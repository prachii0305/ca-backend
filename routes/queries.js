const express = require('express');
const router = express.Router();
const passport = require('passport');
const Query = require('../models/Query');

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied' });
}

// Submit query
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    const query = new Query({
      name,
      email,
      subject,
      message
    });
    await query.save();
    res.json({ msg: 'Query submitted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all queries (admin only)
router.get('/', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const queries = await Query.find().sort({ submittedAt: -1 });
    res.json(queries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete query (admin only)
router.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    await Query.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Query deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
