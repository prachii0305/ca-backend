const app = require('../server'); // Import the Express app

module.exports = (req, res) => {
  app(req, res);
};
