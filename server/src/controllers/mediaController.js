const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

// @desc    Upload media file (Cloudinary stream with local disk fallback)
// @route   POST /api/media/upload
// @access  Public / Protected
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Defense-in-depth: Reject SVG uploads to prevent Stored XSS
    if (req.file.mimetype === 'image/svg+xml' || path.extname(req.file.originalname || '').toLowerCase() === '.svg') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'SVG uploads are rejected for security reasons (Stored XSS prevention).',
      });
    }

    let cloudUploadError = null;

    // 1. Attempt Cloudinary upload if environment credentials are present
    if (isCloudinaryConfigured()) {
      try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const cloudResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'connecthub',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        return res.status(200).json({
          success: true,
          url: cloudResult.secure_url || cloudResult.url,
          filename: cloudResult.public_id,
          storage: 'cloudinary',
        });
      } catch (cloudErr) {
        cloudUploadError = cloudErr;
        console.warn('Cloudinary upload threw error:', cloudErr.message);
      }
    }

    // In production, ephemeral local storage is not persistent across container reboots
    if (process.env.NODE_ENV === 'production') {
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          success: false,
          error: 'StorageConfigurationError',
          message: 'Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) must be configured in production.',
        });
      }
      if (cloudUploadError) {
        return res.status(502).json({
          success: false,
          error: 'CloudinaryUploadError',
          message: `Cloud storage upload failed: ${cloudUploadError.message}`,
        });
      }
    }

    // 2. Local Disk Storage Fallback (Development & Testing only)
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname) || '.jpg';
    const cleanBase = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const targetPath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(targetPath, req.file.buffer);

    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const url = `${protocol}://${host}/uploads/${filename}`;

    return res.status(200).json({
      success: true,
      url,
      filename,
      storage: 'local',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMedia,
  isCloudinaryConfigured,
};
