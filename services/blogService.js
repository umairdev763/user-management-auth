const {
  createBlog,
  findById,
  findByPermalink,
  findPermalinkExceptId,
  listBlogs,
  updateBlog,
  deleteBlog,
  deleteGalleryImage,
  getStats
} = require('../models/blogModel');
const { createUniqueSlug } = require('../utils/slug');
const { fileToImage, removeImage, removeUploadedFiles } = require('../config/upload');

const VALID_STATUSES = new Set(['draft', 'published']);

function parseLocations(rawLocations) {
  let locations = rawLocations;
  if (typeof locations === 'string') {
    try { locations = JSON.parse(locations); } catch { locations = []; }
  }
  if (!Array.isArray(locations)) return { error: 'Locations must be an array.' };

  const cleaned = locations.map(item => ({
    name: String(item?.name || '').trim(),
    city: String(item?.city || '').trim()
  })).filter(item => item.name || item.city);

  if (cleaned.some(item => !item.name || !item.city)) {
    return { error: 'Each location must contain both name and city.' };
  }
  return { locations: cleaned };
}

function validateCommonFields(body) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const status = String(body.status || 'draft').trim();
  if (!title) return { error: 'Title is required.' };
  if (title.length > 200) return { error: 'Title cannot exceed 200 characters.' };
  if (!VALID_STATUSES.has(status)) return { error: 'Status must be draft or published.' };
  const locationResult = parseLocations(body.locations);
  if (locationResult.error) return locationResult;
  return { title, description, status, locations: locationResult.locations };
}

async function createFromRequest(req) {
  try {
    const fields = validateCommonFields(req.body);
    if (fields.error) throw Object.assign(new Error(fields.error), { statusCode: 400 });

    const feature = req.files?.featureImage?.[0];
    const gallery = req.files?.galleryImages || [];
    if (!feature) throw Object.assign(new Error('Exactly one feature image is required.'), { statusCode: 400 });
    if (gallery.length < 1 || gallery.length > 10) {
      throw Object.assign(new Error('Gallery images must contain between 1 and 10 images.'), { statusCode: 400 });
    }

    const permalink = await createUniqueSlug(fields.title, (slug) => findByPermalink(slug));
    const now = new Date();
    const blog = await createBlog({
      title: fields.title,
      permalink,
      description: fields.description,
      featureImage: fileToImage(feature),
      galleryImages: gallery.map(fileToImage),
      status: fields.status,
      locations: fields.locations,
      createdAt: now,
      updatedAt: now
    });
    return blog;
  } catch (error) {
    removeUploadedFiles(req);
    throw error;
  }
}

async function updateFromRequest(id, req) {
  const current = await findById(id);
  if (!current) {
    removeUploadedFiles(req);
    throw Object.assign(new Error('Blog not found.'), { statusCode: 404 });
  }

  try {
    const fields = validateCommonFields(req.body);
    if (fields.error) throw Object.assign(new Error(fields.error), { statusCode: 400 });

    const newFeature = req.files?.featureImage?.[0];
    const newGallery = req.files?.galleryImages || [];
    const updates = {
      title: fields.title,
      description: fields.description,
      status: fields.status,
      locations: fields.locations
    };

    if (fields.title !== current.title) {
      updates.permalink = await createUniqueSlug(fields.title, (slug, currentId) => findPermalinkExceptId(slug, currentId), id);
    }

    if (newFeature) updates.featureImage = fileToImage(newFeature);
    if (newGallery.length) updates.galleryImages = [...(current.galleryImages || []), ...newGallery.map(fileToImage)];
    if (updates.galleryImages && updates.galleryImages.length > 10) {
      throw Object.assign(new Error('A blog can have a maximum of 10 gallery images.'), { statusCode: 400 });
    }

    const updated = await updateBlog(id, updates);
    if (newFeature) removeImage(current.featureImage);
    return updated;
  } catch (error) {
    removeUploadedFiles(req);
    throw error;
  }
}

async function removeBlog(id) {
  const blog = await deleteBlog(id);
  if (!blog) return null;
  removeImage(blog.featureImage);
  (blog.galleryImages || []).forEach(removeImage);
  return blog;
}

async function removeGalleryImage(id, filename) {
  const image = await deleteGalleryImage(id, filename);
  if (image) removeImage(image);
  return image;
}

module.exports = {
  VALID_STATUSES,
  parseLocations,
  validateCommonFields,
  createFromRequest,
  updateFromRequest,
  removeBlog,
  removeGalleryImage,
  listBlogs,
  findById,
  getStats
};
