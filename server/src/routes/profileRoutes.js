const express = require('express');
const router = express.Router();
const {
  getProfiles,
  getMyProfile,
  getProfileById,
  upsertMyProfile,
  deleteMyProfile,
} = require('../controllers/profileController');
const { exportProfilePdf } = require('../controllers/pdfController');
const protect = require('../middleware/auth');

router.get('/', getProfiles);
router.get('/me', protect, getMyProfile);
router.get('/me/pdf', protect, exportProfilePdf);
router.put('/me', protect, upsertMyProfile);
router.post('/', protect, upsertMyProfile);
router.delete('/me', protect, deleteMyProfile);
router.get('/:id/pdf', exportProfilePdf);
router.get('/:id', getProfileById);

module.exports = router;
