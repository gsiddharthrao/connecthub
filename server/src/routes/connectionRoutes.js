const express = require('express');
const router = express.Router();
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getConnections,
  getPendingRequests,
  getConnectionStatus,
} = require('../controllers/connectionController');
const protect = require('../middleware/auth');

router.post('/request', protect, sendRequest);
router.get('/', protect, getConnections);
router.get('/pending', protect, getPendingRequests);
router.get('/status/:userId', protect, getConnectionStatus);

// Support both URL patterns and HTTP methods (POST and PUT)
router.post('/:id/accept', protect, acceptRequest);
router.put('/:id/accept', protect, acceptRequest);
router.put('/accept/:id', protect, acceptRequest);

router.post('/:id/reject', protect, rejectRequest);
router.put('/:id/reject', protect, rejectRequest);
router.put('/reject/:id', protect, rejectRequest);

module.exports = router;
