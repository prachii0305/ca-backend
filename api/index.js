const app = require('../server'); // Import the Express app

module.exports = (req, res) => {
  return app(req, res); // Handle requests with Vercel's serverless function
};
