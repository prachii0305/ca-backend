const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://ca-frontend-fk69co33w-prachi-gandhis-projects.vercel.app', 'https://ca-frontend-8hptv4zsh-prachi-gandhis-projects.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Passport config
require('./config/passport')(passport);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ca-website', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Store uploaded files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Use a unique file name (current timestamp)
  }
});

const upload = multer({ storage });

// Require TeamMember model
const TeamMember = require('./models/TeamMember');

// Route for uploading images (team member images)
app.post('/api/team/upload', upload.single('image'), (req, res) => {
  const { name, position, bio } = req.body;
  const image = req.file.filename;  // Store the file name (not the full path) in MongoDB

  // Create new team member document
  const newMember = new TeamMember({
    name,
    position,
    bio,
    image,  // Store the file name in the database
  });

  newMember.save()
    .then(() => res.status(201).send('Team member added successfully'))
    .catch(err => res.status(500).send('Error saving team member: ' + err));
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/timesheets', require('./routes/timesheets'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/content', require('./routes/content'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/team', require('./routes/team'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/queries', require('./routes/queries'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Serve static files (like uploaded images) from 'uploads/' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Export the app for Vercel
module.exports = app;
