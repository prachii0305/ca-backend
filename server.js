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

console.log('MONGO_URI available:', !!process.env.MONGO_URI);
console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Log without credentials

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
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Creating new MongoDB connection...');
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connection established');
  } catch (e) {
    console.error('MongoDB connection failed:', e.message);
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
try {
  require('./config/passport')(passport);
  console.log('Passport config loaded successfully');
} catch (err) {
  console.error('Error loading passport config:', err);
  throw err;
}

// Connect to DB middleware - only for API routes
const connectDB = async (req, res, next) => {
  try {
    console.log(`Connecting to DB for ${req.method} ${req.path}`);
    await dbConnect();
    console.log(`DB connected for ${req.method} ${req.path}`);
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
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
let TeamMember;
try {
  TeamMember = require('./models/TeamMember');
  console.log('TeamMember model loaded successfully');
} catch (err) {
  console.error('Error loading TeamMember model:', err);
  throw err;
}

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
try {
  app.use('/api/auth', connectDB, require('./routes/auth'));
  console.log('Auth routes loaded');
} catch (err) {
  console.error('Error loading auth routes:', err);
}

try {
  app.use('/api/timesheets', connectDB, require('./routes/timesheets'));
  console.log('Timesheets routes loaded');
} catch (err) {
  console.error('Error loading timesheets routes:', err);
}

try {
  app.use('/api/tasks', connectDB, require('./routes/tasks'));
  console.log('Tasks routes loaded');
} catch (err) {
  console.error('Error loading tasks routes:', err);
}

try {
  app.use('/api/content', connectDB, require('./routes/content'));
  console.log('Content routes loaded');
} catch (err) {
  console.error('Error loading content routes:', err);
}

try {
  app.use('/api/blogs', connectDB, require('./routes/blogs'));
  console.log('Blogs routes loaded');
} catch (err) {
  console.error('Error loading blogs routes:', err);
}

try {
  app.use('/api/team', connectDB, require('./routes/team'));
  console.log('Team routes loaded');
} catch (err) {
  console.error('Error loading team routes:', err);
}

try {
  app.use('/api/applications', connectDB, require('./routes/applications'));
  console.log('Applications routes loaded');
} catch (err) {
  console.error('Error loading applications routes:', err);
}

try {
  app.use('/api/queries', connectDB, require('./routes/queries'));
  console.log('Queries routes loaded');
} catch (err) {
  console.error('Error loading queries routes:', err);
}

try {
  app.use('/api/dashboard', connectDB, require('./routes/dashboard'));
  console.log('Dashboard routes loaded');
} catch (err) {
  console.error('Error loading dashboard routes:', err);
}

// Serve static files (like uploaded images) from 'uploads/' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Handle favicon.ico and other common static files
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/robots.txt', (req, res) => res.status(204).end());
app.get('/manifest.json', (req, res) => res.status(204).end());

// Catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the app for Vercel
module.exports = app;
