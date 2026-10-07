const express = require('express');
const { requireAdmin } = require('../middleware/authMiddleware');
const { modelUpload } = require('../config/upload');
const {
  getModelStats,
  getModels,
  getModel,
  createModel,
  editModel,
  deleteModel,
  deleteModelGalleryImage,
  deleteModelFeatureImage
} = require('../controllers/modelController');

const router = express.Router();

router.use(requireAdmin);
router.get('/stats', getModelStats);
router.get('/', getModels);
router.get('/:id', getModel);
router.post('/', modelUpload, createModel);
router.put('/:id', modelUpload, editModel);
router.delete('/:id', deleteModel);
router.delete('/:id/gallery-image', deleteModelGalleryImage);
router.delete('/:id/feature-image', deleteModelFeatureImage);

module.exports = router;
