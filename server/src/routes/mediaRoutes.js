const express = require('express');
const router = express.Router();
const { handleUpload } = require('../middleware/upload');
const { uploadMedia } = require('../controllers/mediaController');

// Support both /api/media/upload and /api/media
router.post('/upload', handleUpload, uploadMedia);
router.post('/', handleUpload, uploadMedia);

module.exports = router;
