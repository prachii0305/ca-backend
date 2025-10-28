 const express = require('express');
const router = express.Router();
const passport = require('passport');
const TeamMember = require('../models/TeamMember');
const multer = require('multer');

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied' });
}

// Multer config for image upload (memory storage for Vercel compatibility)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all team members
router.get('/', async (req, res) => {
  try {
    console.log('Fetching team members...');
    const team = await TeamMember.find().sort({ order: 1, addedAt: 1 });
    console.log('Team members found:', team.length);
    // Modify image path to be data URL for frontend (base64 images)
    const modifiedTeam = team.map(member => {
      member = member.toObject();
      if (member.imageData) {
        // Create data URL from base64 data
        const mimeType = 'image/jpeg'; // Default, could be enhanced to detect actual type
        member.image = `data:${mimeType};base64,${member.imageData}`;
      } else if (member.image) {
        // Fallback for old format
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
    console.log('Creating team member:', { name, position, bio, hasImage: !!req.file });

    let imageData = null;
    let imageName = null;

    if (req.file) {
      // Convert buffer to base64 for storage
      imageData = req.file.buffer.toString('base64');
      imageName = Date.now() + '_' + req.file.originalname;
    }

    const teamMember = new TeamMember({
      name,
      position,
      bio,
      image: imageName,
      imageData: imageData, // Store base64 data
      addedBy: req.user.id
    });

    await teamMember.save();
    console.log('Team member created successfully:', teamMember._id);
    res.json(teamMember);
  } catch (err) {
    console.error('Error creating team member:', err.message);
    console.error('Full error:', err);
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
