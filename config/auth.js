const passport = require('passport');
const nodemailer = require('nodemailer');

// Middleware to ensure user is authenticated
const ensureAuthenticated = passport.authenticate('jwt', { session: false });

// Middleware to ensure user is admin
const ensureAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin role required.' });
};

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  transporter
};
