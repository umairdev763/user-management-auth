const {
  createModel,
  findById,
  findByPermalink,
  findPermalinkExceptId,
  listModels,
  updateModel,
  deleteModel,
  getStats
} = require('../models/modelModel');
const { createUniqueSlug } = require('../utils/slug');
const { fileToImage, removeImage, removeUploadedFiles } = require('../config/upload');

const VALID_STATUSES = new Set(['draft', 'published']);
const CATEGORIES = ['Sport', 'Cruiser', 'Fishing', 'Yacht', 'Pontoon', 'Other'];

function validateHullColorsStructure(hullColors) {
  if (!Array.isArray(hullColors)) return { error: 'Hull colors must be an array.' };

  for (const grandParent of hullColors) {
    if (!grandParent.name || typeof grandParent.name !== 'string') {
      return { error: 'Each Grand Parent section must have a name.' };
    }
    if (!Array.isArray(grandParent.parents)) {
      return { error: 'Grand Parent must have parents array.' };
    }

    for (const parent of grandParent.parents) {
      if (!parent.name || typeof parent.name !== 'string') {
        return { error: 'Each Parent section must have a name.' };
      }
      if (!Array.isArray(parent.colors)) {
        return { error: 'Parent must have colors array.' };
      }

      for (const color of parent.colors) {
        if (!color.name || typeof color.name !== 'string') {
          return { error: 'Each Color must have a name.' };
        }
        if (typeof color.price !== 'number' || color.price < 0) {
          return { error: 'Color price must be a positive number.' };
        }
        if (!color.colorCode || typeof color.colorCode !== 'string') {
          return { error: 'Each Color must have a color code.' };
        }
      }
    }
  }

  return { hullColors };
}

function validateCommonFields(body) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const year = String(body.year || '').trim();
  const make = String(body.make || '').trim();
  const model = String(body.model || '').trim();
  const category = String(body.category || '').trim();
  const status = String(body.status || 'draft').trim();

  if (!title) return { error: 'Title is required.' };
  if (title.length > 200) return { error: 'Title cannot exceed 200 characters.' };
  if (!year) return { error: 'Year is required.' };
  if (!make) return { error: 'Make is required.' };
  if (!model) return { error: 'Model is required.' };
  if (!category) return { error: 'Category is required.' };
  if (!CATEGORIES.includes(category)) return { error: 'Invalid category.' };
  if (!VALID_STATUSES.has(status)) return { error: 'Status must be draft or published.' };

  return { title, description, year, make, model, category, status };
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

    let hullColors = [];
    if (req.body.hullColors) {
      try {
        hullColors = JSON.parse(req.body.hullColors);
        const hullValidation = validateHullColorsStructure(hullColors);
        if (hullValidation.error) throw Object.assign(new Error(hullValidation.error), { statusCode: 400 });
        hullColors = hullValidation.hullColors;
      } catch (e) {
        if (e.statusCode) throw e;
        throw Object.assign(new Error('Invalid hull colors data.'), { statusCode: 400 });
      }
    }

    const permalink = await createUniqueSlug(fields.title, (slug) => findByPermalink(slug));
    const now = new Date();
    const model = await createModel({
      title: fields.title,
      permalink,
      description: fields.description,
      year: fields.year,
      make: fields.make,
      model: fields.model,
      category: fields.category,
      featureImage: fileToImage(feature, 'model'),
      galleryImages: gallery.map(file => fileToImage(file, 'model')),
      hullColors: hullColors,
      status: fields.status,
      createdAt: now,
      updatedAt: now
    });
    return model;
  } catch (error) {
    removeUploadedFiles(req, 'model');
    throw error;
  }
}

async function updateFromRequest(id, req) {
  const current = await findById(id);
  if (!current) {
    removeUploadedFiles(req, 'model');
    throw Object.assign(new Error('Model not found.'), { statusCode: 404 });
  }

  try {
    const fields = validateCommonFields(req.body);
    if (fields.error) throw Object.assign(new Error(fields.error), { statusCode: 400 });

    const newFeature = req.files?.featureImage?.[0];
    const newGallery = req.files?.galleryImages || [];
    const updates = {
      title: fields.title,
      description: fields.description,
      year: fields.year,
      make: fields.make,
      model: fields.model,
      category: fields.category,
      status: fields.status
    };

    if (fields.title !== current.title) {
      updates.permalink = await createUniqueSlug(fields.title, (slug, currentId) => findPermalinkExceptId(slug, currentId), id);
    }

    if (newFeature) updates.featureImage = fileToImage(newFeature, 'model');
    if (newGallery.length) updates.galleryImages = [...(current.galleryImages || []), ...newGallery.map(file => fileToImage(file, 'model'))];
    if (updates.galleryImages && updates.galleryImages.length > 10) {
      throw Object.assign(new Error('A model can have a maximum of 10 gallery images.'), { statusCode: 400 });
    }

    if (req.body.hullColors) {
      try {
        const hullColors = JSON.parse(req.body.hullColors);
        const hullValidation = validateHullColorsStructure(hullColors);
        if (hullValidation.error) throw Object.assign(new Error(hullValidation.error), { statusCode: 400 });
        updates.hullColors = hullValidation.hullColors;
      } catch (e) {
        if (e.statusCode) throw e;
        throw Object.assign(new Error('Invalid hull colors data.'), { statusCode: 400 });
      }
    }

    const updated = await updateModel(id, updates);
    if (newFeature) removeImage(current.featureImage, 'model');
    return updated;
  } catch (error) {
    removeUploadedFiles(req, 'model');
    throw error;
  }
}

async function removeModel(id) {
  const model = await deleteModel(id);
  if (!model) return null;
  removeImage(model.featureImage, 'model');
  (model.galleryImages || []).forEach(img => removeImage(img, 'model'));

  if (model.hullColors) {
    model.hullColors.forEach(grandParent => {
      grandParent.parents?.forEach(parent => {
        if (parent.featureImage) removeImage(parent.featureImage, 'model');
        parent.colors?.forEach(color => {
          if (color.image) removeImage(color.image, 'model');
        });
      });
    });
  }

  return model;
}

module.exports = {
  VALID_STATUSES,
  CATEGORIES,
  validateCommonFields,
  validateHullColorsStructure,
  createFromRequest,
  updateFromRequest,
  removeModel,
  listModels,
  findById,
  getStats
};
