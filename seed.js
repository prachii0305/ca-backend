const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

require('dotenv').config();

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

const seedAdmin = async () => {
  try {
    await dbConnect();

    const adminExists = await User.findOne({ email: 'admin@shruti.com' });
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin',
      email: 'admin@shruti.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created: email: admin@shruti.com, password: admin123');
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
