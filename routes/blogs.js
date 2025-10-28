const express = require('express');
const router = express.Router();
const passport = require('passport');
const multer = require('multer');
const Blog = require('../models/Blog');

// Configure multer for PDF uploads (memory storage for Vercel compatibility)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied' });
}

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().populate('author', 'name').sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single blog
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name');
    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found' });
    }
    res.json(blog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create blog (admin only) - supports both text content and PDF upload
router.post('/', passport.authenticate('jwt', { session: false }), isAdmin, upload.single('file'), async (req, res) => {
  const { title, content } = req.body;
  try {
    const blogData = {
      title,
      author: req.user.id
    };

    if (req.file) {
      // PDF upload - store as base64
      blogData.fileData = req.file.buffer.toString('base64');
      blogData.fileName = req.file.originalname;
      blogData.fileType = req.file.mimetype;
    } else {
      // Text content
      blogData.content = content;
    }

    const blog = new Blog(blogData);
    await blog.save();
    res.json(blog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update blog (admin only)
router.put('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  const { title, content } = req.body;
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found' });
    }
    blog.title = title;
    blog.content = content;
    blog.updatedAt = Date.now();
    await blog.save();
    res.json(blog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Download blog file
router.get('/file/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || !blog.fileData) {
      return res.status(404).json({ msg: 'Blog file not found' });
    }

    // Convert base64 back to buffer and send as download
    const buffer = Buffer.from(blog.fileData, 'base64');
    res.setHeader('Content-Type', blog.fileType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${blog.fileName}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// View blog file (for iframe display)
router.get('/view/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || !blog.fileData) {
      return res.status(404).json({ msg: 'Blog file not found' });
    }

    // Convert base64 back to buffer and send for viewing
    const buffer = Buffer.from(blog.fileData, 'base64');
    res.setHeader('Content-Type', blog.fileType || 'application/pdf');
    res.send(buffer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete blog (admin only)
router.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Blog deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
