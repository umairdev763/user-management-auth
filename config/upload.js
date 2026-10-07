const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const BLOG_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'blogs');
fs.mkdirSync(BLOG_UPLOAD_DIR, { recursive: true });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, BLOG_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    files: 11,
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

function uploadedFiles(req) {
  return Object.values(req.files || {}).flat();
}

function fileToImage(file) {
  return {
    filename: file.filename,
    path: `/uploads/blogs/${file.filename}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  };
}

function removeFile(filename) {
  if (!filename) return;
  const filePath = path.join(BLOG_UPLOAD_DIR, path.basename(filename));
  fs.rmSync(filePath, { force: true });
}

function removeImage(image) {
  if (image?.filename) removeFile(image.filename);
}

function removeUploadedFiles(req) {
  uploadedFiles(req).forEach(file => removeFile(file.filename));
}

module.exports = {
  BLOG_UPLOAD_DIR,
  blogUpload,
  fileToImage,
  removeFile,
  removeImage,
  removeUploadedFiles
};
