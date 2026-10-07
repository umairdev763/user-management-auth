const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { publicNewsBlogs } = require('../controllers/blogController');

const router = express.Router();

router.get('/', (req, res) => res.render('home/index', { title: 'Home' }));
router.get('/login', (req, res) => res.render('auth/login', { title: 'Login' }));
router.get('/register', (req, res) => res.render('auth/register', { title: 'Register' }));
router.get('/dashboard', requireAuth, (req, res) => res.render('user/dashboard', { title: 'Dashboard', user: req.user }));
router.get('/admin', requireAdmin, (req, res) => res.render('admin/index', { title: 'Admin Panel', user: req.user }));
router.get('/admin/create_new_blog', requireAdmin, (req, res) => res.render('admin/blog/form', { title: 'Create New Blog', user: req.user, mode: 'create' }));
router.get('/admin/list_blog', requireAdmin, (req, res) => res.render('admin/blog/list', { title: 'Blog List', user: req.user }));
router.get('/admin/edit_blog', requireAdmin, (req, res) => res.render('admin/blog/form', { title: 'Edit Blog', user: req.user, blogId: req.query.id, mode: 'edit' }));
router.get('/admin/create_new_model', requireAdmin, (req, res) => res.render('admin/model/form', { title: 'Create New Model', user: req.user, mode: 'create' }));
router.get('/admin/list_model', requireAdmin, (req, res) => res.render('admin/model/list', { title: 'Model List', user: req.user }));
router.get('/admin/edit_model', requireAdmin, (req, res) => res.render('admin/model/form', { title: 'Edit Model', user: req.user, modelId: req.query.id, mode: 'edit' }));
router.get('/news', publicNewsBlogs);
router.get('/news_blogs', publicNewsBlogs);

module.exports = router;
