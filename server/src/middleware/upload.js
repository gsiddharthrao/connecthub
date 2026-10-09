const multer = require('multer');

// Configure in-memory storage so buffers can be streamed to Cloudinary or written to disk
const storage = multer.memoryStorage();

// Allowed image MIME types (SVG is strictly rejected to prevent Stored XSS)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const fileFilter = (req, file, cb) => {
  const isSvgMime = file.mimetype === 'image/svg+xml';
  const isSvgExt = (file.originalname || '').toLowerCase().endsWith('.svg');

  if (isSvgMime || isSvgExt) {
    const error = new Error('Invalid file type. SVG uploads are rejected for security reasons (Stored XSS prevention). Please upload JPG, PNG, WEBP, or GIF.');
    error.status = 400;
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.');
    error.status = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

// Middleware wrapper that gracefully extracts a single file from fields named 'file', 'image', or any field
const handleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'LIMIT_FILE_SIZE',
          message: 'File size exceeds limit of 5MB',
        });
      }
      return res.status(400).json({
        success: false,
        error: err.code || 'UploadError',
        message: err.message || 'Error uploading file',
      });
    }

    // Populate req.file if any file was provided in multipart body
    if (req.files && req.files.length > 0) {
      req.file =
        req.files.find((f) => f.fieldname === 'file') ||
        req.files.find((f) => f.fieldname === 'image') ||
        req.files[0];
    }

    next();
  });
};

module.exports = {
  upload,
  handleUpload,
};
