const express = require('express');
const { requireAdmin } = require('../middleware/authMiddleware');
const { blogUpload } = require('../config/upload');
const {
  getBlogStats,
  getBlogs,
  getBlog,
  createBlog,
  editBlog,
  deleteBlog,
  deleteBlogGalleryImage
} = require('../controllers/blogController');

const router = express.Router();

router.use(requireAdmin);
router.get('/stats', getBlogStats);
router.get('/', getBlogs);
router.get('/:id', getBlog);
router.post('/', blogUpload, createBlog);
router.put('/:id', blogUpload, editBlog);
router.delete('/:id', deleteBlog);
router.delete('/:id/gallery-image', deleteBlogGalleryImage);

module.exports = router;
