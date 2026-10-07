const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const BLOG_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'blogs');
const MODEL_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'models');
fs.mkdirSync(BLOG_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(MODEL_UPLOAD_DIR, { recursive: true });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const fieldName = file.fieldname;
    let uploadDir;
    if (fieldName.startsWith('parent') || fieldName.startsWith('color') || fieldName === 'featureImage' || fieldName === 'galleryImages') {
      uploadDir = MODEL_UPLOAD_DIR;
    } else {
      uploadDir = BLOG_UPLOAD_DIR;
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    files: 50,
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return cb(new Error('Only JPG, JPEG, PNG, WEBP and GIF images are allowed.'));
    }
    cb(null, true);
  }
});

function blogUpload(req, res, next) {
  upload.fields([
    { name: 'featureImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
  ])(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Each image must be 5MB or smaller.' });
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Upload a maximum of 1 feature image and 10 gallery images.' });
      }
    }
    return res.status(400).json({ message: error.message || 'Invalid image upload.' });
  });
}

function modelUpload(req, res, next) {
  upload.fields([
    { name: 'featureImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
  ])(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Each image must be 5MB or smaller.' });
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Upload a maximum of 1 feature image and 10 gallery images.' });
      }
    }
    return res.status(400).json({ message: error.message || 'Invalid image upload.' });
  });
}

function hullColorsUpload(req, res, next) {
  upload.any()(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Each image must be 5MB or smaller.' });
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files uploaded.' });
      }
    }
    return res.status(400).json({ message: error.message || 'Invalid image upload.' });
  });
}

function uploadedFiles(req) {
  return Object.values(req.files || {}).flat();
}

function fileToImage(file, uploadType = 'blog') {
  const uploadDir = uploadType === 'model' ? 'models' : 'blogs';
  return {
    filename: file.filename,
    path: `/uploads/${uploadDir}/${file.filename}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  };
}

function removeFile(filename, uploadType = 'blog') {
  if (!filename) return;
  const uploadDir = uploadType === 'model' ? MODEL_UPLOAD_DIR : BLOG_UPLOAD_DIR;
  const filePath = path.join(uploadDir, path.basename(filename));
  fs.rmSync(filePath, { force: true });
}

function removeImage(image, uploadType = 'blog') {
  if (image?.filename) removeFile(image.filename, uploadType);
}

function removeUploadedFiles(req, uploadType = 'blog') {
  uploadedFiles(req).forEach(file => removeFile(file.filename, uploadType));
}

module.exports = {
  BLOG_UPLOAD_DIR,
  MODEL_UPLOAD_DIR,
  blogUpload,
  modelUpload,
  hullColorsUpload,
  fileToImage,
  removeFile,
  removeImage,
  removeUploadedFiles
};
