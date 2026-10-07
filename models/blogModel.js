const { ObjectId } = require('mongodb');
const { blogsCollection } = require('../config/db');

function serializeBlog(blog) {
  if (!blog) return null;
  return {
    ...blog,
    _id: blog._id?.toString()
  };
}

async function createBlog(data) {
  const result = await blogsCollection().insertOne(data);
  return findById(result.insertedId.toString());
}

async function findById(id) {
  if (!ObjectId.isValid(id)) return null;
  return blogsCollection().findOne({ _id: new ObjectId(id) });
}

async function findByPermalink(permalink) {
  return blogsCollection().findOne({ permalink });
}

async function findPermalinkExceptId(permalink, id) {
  const filter = { permalink };
  if (id && ObjectId.isValid(id)) filter._id = { $ne: new ObjectId(id) };
  return blogsCollection().findOne(filter);
}

async function listBlogs({ status, search = '' } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (search.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { permalink: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const blogs = await blogsCollection().find(filter).sort({ createdAt: -1 }).toArray();
  return blogs.map(serializeBlog);
}

async function updateBlog(id, updates) {
  if (!ObjectId.isValid(id)) return null;
  await blogsCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return findById(id);
}

async function deleteBlog(id) {
  if (!ObjectId.isValid(id)) return null;
  const blog = await findById(id);
  if (!blog) return null;
  await blogsCollection().deleteOne({ _id: new ObjectId(id) });
  return blog;
}

async function deleteGalleryImage(id, filename) {
  if (!ObjectId.isValid(id)) return null;
  const blog = await findById(id);
  if (!blog) return null;

  const gallery = blog.galleryImages || [];
  if (gallery.length <= 1) {
    const error = new Error('A blog must have at least one gallery image.');
    error.code = 'MIN_GALLERY_IMAGES';
    throw error;
  }

  const image = gallery.find(item => item.filename === filename);
  if (!image) return null;

  await blogsCollection().updateOne(
    { _id: new ObjectId(id) },
    { $pull: { galleryImages: { filename } }, $set: { updatedAt: new Date() } }
  );
  return image;
}

async function getStats() {
  const [total, published, drafts] = await Promise.all([
    blogsCollection().countDocuments(),
    blogsCollection().countDocuments({ status: 'published' }),
    blogsCollection().countDocuments({ status: 'draft' })
  ]);
  return { total, published, drafts };
}

module.exports = {
  serializeBlog,
  createBlog,
  findById,
  findByPermalink,
  findPermalinkExceptId,
  listBlogs,
  updateBlog,
  deleteBlog,
  deleteGalleryImage,
  getStats
};
