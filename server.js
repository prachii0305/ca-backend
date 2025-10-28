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

// MongoDB connection setup for serverless
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ca-website';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage in serverless.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

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

// Connect to DB middleware - only for API routes
const connectDB = async (req, res, next) => {
  try {
    await dbConnect();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
};

// Add health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

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

// API Routes - apply DB connection middleware only to API routes
app.use('/api/auth', connectDB, require('./routes/auth'));
app.use('/api/timesheets', connectDB, require('./routes/timesheets'));
app.use('/api/tasks', connectDB, require('./routes/tasks'));
app.use('/api/content', connectDB, require('./routes/content'));
app.use('/api/blogs', connectDB, require('./routes/blogs'));
app.use('/api/team', connectDB, require('./routes/team'));
app.use('/api/applications', connectDB, require('./routes/applications'));
app.use('/api/queries', connectDB, require('./routes/queries'));
app.use('/api/dashboard', connectDB, require('./routes/dashboard'));

// Serve static files (like uploaded images) from 'uploads/' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Export the app for Vercel
module.exports = app;
