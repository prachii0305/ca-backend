 const express = require('express');
const router = express.Router();
const passport = require('passport');
const TeamMember = require('../models/TeamMember');
const multer = require('multer');
const path = require('path');

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied' });
}

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all team members
router.get('/', async (req, res) => {
  try {
    console.log('Fetching team members...');
    const team = await TeamMember.find().sort({ order: 1, addedAt: 1 });
    console.log('Team members found:', team.length);
    // Modify image path to be relative to /uploads for frontend
    const modifiedTeam = team.map(member => {
      member = member.toObject();
      if (member.image) {
        member.image = `https://ca-backend-prachi-gandhis-projects.vercel.app/uploads/${member.image}`;
      }
      return member;
    });
    res.json(modifiedTeam);
  } catch (err) {
    console.error('Error in GET /api/team:', err.message);
    console.error('Full error:', err);
    res.status(500).send('Server error');
  }
});

// Add team member (admin only)
router.post('/', passport.authenticate('jwt', { session: false }), isAdmin, upload.single('image'), async (req, res) => {
  const { name, position, bio } = req.body;
  try {
    const teamMember = new TeamMember({
      name,
      position,
      bio,
      image: req.file ? req.file.filename : null,
      addedBy: req.user.id
    });
    await teamMember.save();
    res.json(teamMember);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update team member (admin only)
router.put('/:id', passport.authenticate('jwt', { session: false }), isAdmin, upload.single('image'), async (req, res) => {
  const { name, position, bio } = req.body;
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    teamMember.name = name;
    teamMember.position = position;
    teamMember.bio = bio;
    if (req.file) {
      teamMember.image = req.file.filename;
    }
    await teamMember.save();
    res.json(teamMember);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update team member order (admin only)
router.put('/:id/order', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  const { order } = req.body;
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    teamMember.order = order;
    await teamMember.save();
    res.json(teamMember);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete team member (admin only)
router.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    await TeamMember.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Team member deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
