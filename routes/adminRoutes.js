const express = require('express');
const { requireAdmin } = require('../middleware/authMiddleware');
const { dashboard } = require('../controllers/adminController');

const router = express.Router();
router.get('/stats', requireAdmin, dashboard);

module.exports = router;
