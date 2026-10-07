const { ObjectId } = require('mongodb');
const {
  createFromRequest,
  updateFromRequest,
  removeBlog,
  removeGalleryImage,
  listBlogs,
  findById,
  getStats
} = require('../services/blogService');

function sendError(res, error, fallback = 'Request failed.') {
  const status = error.statusCode || (error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? 'Permalink already exists. Please try again.' : (error.message || fallback);
  console.error(error);
  return res.status(status).json({ message });
}

async function getBlogStats(req, res) {
  try {
    res.json({ stats: await getStats() });
  } catch (error) {
    sendError(res, error, 'Could not load blog statistics.');
  }
}

async function getBlogs(req, res) {
  try {
    res.json({ blogs: await listBlogs({ search: req.query.search || '' }) });
  } catch (error) {
    sendError(res, error, 'Could not load blogs.');
  }
}

async function getBlog(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid blog ID.' });
    const blog = await findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });
    res.json({ blog: { ...blog, _id: blog._id.toString() } });
  } catch (error) {
    sendError(res, error, 'Could not load blog.');
  }
}

async function createBlog(req, res) {
  try {
    const blog = await createFromRequest(req);
    res.status(201).json({ message: 'Blog created.', blog: { ...blog, _id: blog._id.toString() } });
  } catch (error) {
    sendError(res, error, 'Could not create blog.');
  }
}

async function editBlog(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid blog ID.' });
    const blog = await updateFromRequest(req.params.id, req);
    res.json({ message: 'Blog updated.', blog: { ...blog, _id: blog._id.toString() } });
  } catch (error) {
    sendError(res, error, 'Could not update blog.');
  }
}

async function deleteBlog(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid blog ID.' });
    const blog = await removeBlog(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });
    res.json({ message: 'Blog deleted.' });
  } catch (error) {
    sendError(res, error, 'Could not delete blog.');
  }
}

async function deleteBlogGalleryImage(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid blog ID.' });
    const filename = String(req.body.filename || '').trim();
    if (!filename) return res.status(400).json({ message: 'Image filename is required.' });
    const image = await removeGalleryImage(req.params.id, filename);
    if (!image) return res.status(404).json({ message: 'Gallery image not found.' });
    res.json({ message: 'Gallery image deleted.' });
  } catch (error) {
    if (error.code === 'MIN_GALLERY_IMAGES') return res.status(400).json({ message: error.message });
    sendError(res, error, 'Could not delete gallery image.');
  }
}

async function publicNewsBlogs(req, res) {
  try {
    const blogs = await listBlogs({ status: 'published' });
    res.render('news/index', { title: 'News & Blogs', blogs });
  } catch (error) {
    console.error(error);
    res.status(500).render('home/404', { title: 'Unable to load news' });
  }
}

module.exports = {
  getBlogStats,
  getBlogs,
  getBlog,
  createBlog,
  editBlog,
  deleteBlog,
  deleteBlogGalleryImage,
  publicNewsBlogs
};
