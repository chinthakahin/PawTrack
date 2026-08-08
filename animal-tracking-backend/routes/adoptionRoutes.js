const express = require('express');
const { submitRequest, getRequests, updateRequestStatus } = require('../controllers/adoptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Submit adoption request — public can submit (optionally authenticated)
router.post('/', submitRequest);

// Get all requests — volunteer only
router.get('/', protect, authorize('volunteer'), getRequests);

// Update status (approve/reject) — volunteer only
router.put('/:id', protect, authorize('volunteer'), updateRequestStatus);

module.exports = router;
