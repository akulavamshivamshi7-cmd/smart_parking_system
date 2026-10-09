const express = require('express');
const router = express.Router();
const {
  checkAvailability,
  createReservation,
  getReservations,
  getReservationById,
  cancelReservation,
  updateReservationStatus
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');

// Public availability endpoint
router.get('/availability', checkAvailability);

// Authenticated routes
router.use(protect);

router.post('/', createReservation);
router.get('/', getReservations);
router.get('/:id', getReservationById);
router.patch('/:id/cancel', cancelReservation);
router.put('/:id', authorize('admin'), updateReservationStatus);

module.exports = router;
