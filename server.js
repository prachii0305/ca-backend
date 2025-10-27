const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

module.exports = app;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Passport config
require('./config/passport')(passport);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ca-website')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/timesheets', require('./routes/timesheets'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/content', require('./routes/content'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/team', require('./routes/team'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/queries', require('./routes/queries'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


  // Export for Vercel
  module.exports = app;


