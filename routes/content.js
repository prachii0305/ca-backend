const express = require('express');
const router = express.Router();
const passport = require('passport');
const Content = require('../models/Content');

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied' });
}

// Get content for a page
router.get('/:page', async (req, res) => {
  try {
    const content = await Content.findOne({ page: req.params.page });
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }
    res.json(content);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all content (admin only)
router.get('/', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const contents = await Content.find().sort({ updatedAt: -1 });
    res.json(contents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create or update content (admin only)
router.post('/', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  const { page, title, content } = req.body;
  try {
    let existingContent = await Content.findOne({ page });
    if (existingContent) {
      existingContent.title = title;
      existingContent.content = content;
      existingContent.updatedAt = Date.now();
      existingContent.updatedBy = req.user.id;
      await existingContent.save();
      res.json(existingContent);
    } else {
      const newContent = new Content({
        page,
        title,
        content,
        updatedBy: req.user.id
      });
      await newContent.save();
      res.json(newContent);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete content (admin only)
router.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Content deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
