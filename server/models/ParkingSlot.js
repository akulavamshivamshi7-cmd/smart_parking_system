const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: [true, 'Slot number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    slotType: {
      type: String,
      enum: ['two-wheeler', 'four-wheeler', 'accessible'],
      default: 'four-wheeler',
      required: true
    },
    section: {
      type: String,
      required: [true, 'Section or floor location is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied', 'maintenance'],
      default: 'available'
    },
    basePricePerHour: {
      type: Number,
      default: 20,
      min: [0, 'Base price per hour cannot be negative']
    },
    isUnderMaintenance: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

parkingSlotSchema.index({ section: 1, slotType: 1 });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
