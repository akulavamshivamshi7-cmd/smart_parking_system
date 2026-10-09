const express = require('express');
const router = express.Router();
const {
  getAllSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot
} = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getAllSlots);
router.get('/:id', getSlotById);
router.post('/', protect, authorize('admin'), createSlot);
router.put('/:id', protect, authorize('admin'), updateSlot);
router.delete('/:id', protect, authorize('admin'), deleteSlot);

module.exports = router;
