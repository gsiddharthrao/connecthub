const express = require('express');
const router = express.Router();
const { exportProfilePdf } = require('../controllers/pdfController');

// Support /api/pdf/:id
router.get('/:id', exportProfilePdf);

module.exports = router;
