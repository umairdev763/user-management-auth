const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', (req, res) => res.render('home/index', { title: 'Home' }));
router.get('/login', (req, res) => res.render('auth/login', { title: 'Login' }));
router.get('/register', (req, res) => res.render('auth/register', { title: 'Register' }));
router.get('/dashboard', requireAuth, (req, res) => res.render('user/dashboard', { title: 'Dashboard', user: req.user }));
router.get('/admin', requireAdmin, (req, res) => res.render('admin/index', { title: 'Admin Panel', user: req.user }));

module.exports = router;
