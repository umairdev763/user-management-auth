const { getStats: getUserStats } = require('../models/userModel');
const { getStats: getBlogStats } = require('../models/blogModel');
const { getStats: getModelStats } = require('../models/modelModel');

async function dashboard(req, res) {
  try {
    const [userStats, blogStats, modelStats] = await Promise.all([
      getUserStats(),
      getBlogStats(),
      getModelStats()
    ]);
    res.json({ stats: { ...userStats, blogs: blogStats, models: modelStats } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load statistics.' });
  }
}

module.exports = { dashboard };
