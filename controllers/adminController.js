const { getStats } = require('../models/userModel');

async function dashboard(req, res) {
  try {
    const stats = await getStats();
    res.json({ stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load statistics.' });
  }
}

module.exports = { dashboard };
