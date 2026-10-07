const { ObjectId } = require('mongodb');
const {
  createFromRequest,
  updateFromRequest,
  removeModel,
  listModels,
  findById,
  getStats
} = require('../services/modelService');

function sendError(res, error, fallback = 'Request failed.') {
  const status = error.statusCode || (error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? 'Permalink already exists. Please try again.' : (error.message || fallback);
  console.error(error);
  return res.status(status).json({ message });
}

async function getModelStats(req, res) {
  try {
    res.json({ stats: await getStats() });
  } catch (error) {
    sendError(res, error, 'Could not load model statistics.');
  }
}

async function getModels(req, res) {
  try {
    res.json({ models: await listModels({ search: req.query.search || '' }) });
  } catch (error) {
    sendError(res, error, 'Could not load models.');
  }
}

async function getModel(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid model ID.' });
    const model = await findById(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model not found.' });
    res.json({ model: { ...model, _id: model._id.toString() } });
  } catch (error) {
    sendError(res, error, 'Could not load model.');
  }
}

async function createModel(req, res) {
  try {
    const model = await createFromRequest(req);
    res.status(201).json({ message: 'Model created.', model: { ...model, _id: model._id.toString() } });
  } catch (error) {
    sendError(res, error, 'Could not create model.');
  }
}

async function editModel(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid model ID.' });
    const model = await updateFromRequest(req.params.id, req);
    res.json({ message: 'Model updated.', model: { ...model, _id: model._id.toString() } });
  } catch (error) {
    sendError(res, error, 'Could not update model.');
  }
}

async function deleteModel(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid model ID.' });
    const model = await removeModel(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model not found.' });
    res.json({ message: 'Model deleted.' });
  } catch (error) {
    sendError(res, error, 'Could not delete model.');
  }
}

async function deleteModelGalleryImage(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid model ID.' });
    const filename = String(req.body.filename || '').trim();
    if (!filename) return res.status(400).json({ message: 'Image filename is required.' });

    const model = await findById(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model not found.' });

    const gallery = model.galleryImages || [];
    if (gallery.length <= 1) {
      return res.status(400).json({ message: 'A model must keep at least one gallery image.' });
    }

    const image = gallery.find(item => item.filename === filename);
    if (!image) return res.status(404).json({ message: 'Gallery image not found.' });

    const { removeImage } = require('../config/upload');
    const { updateModel } = require('../models/modelModel');

    await updateModel(req.params.id, {
      galleryImages: gallery.filter(item => item.filename !== filename),
      updatedAt: new Date()
    });

    removeImage(image, 'model');
    res.json({ message: 'Gallery image deleted.' });
  } catch (error) {
    sendError(res, error, 'Could not delete gallery image.');
  }
}

async function deleteModelFeatureImage(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid model ID.' });
    const filename = String(req.body.filename || '').trim();
    if (!filename) return res.status(400).json({ message: 'Image filename is required.' });

    const model = await findById(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model not found.' });

    if (!model.featureImage || model.featureImage.filename !== filename) {
      return res.status(404).json({ message: 'Feature image not found.' });
    }

    const { removeImage } = require('../config/upload');
    const { updateModel } = require('../models/modelModel');

    await updateModel(req.params.id, {
      featureImage: null,
      updatedAt: new Date()
    });

    removeImage(model.featureImage, 'model');
    res.json({ message: 'Feature image deleted.' });
  } catch (error) {
    sendError(res, error, 'Could not delete feature image.');
  }
}

module.exports = {
  getModelStats,
  getModels,
  getModel,
  createModel,
  editModel,
  deleteModel,
  deleteModelGalleryImage,
  deleteModelFeatureImage
};
