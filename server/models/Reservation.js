const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required']
    },
    parkingSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: [true, 'Parking slot reference is required']
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required']
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    durationHours: {
      type: Number,
      required: true,
      min: [0.5, 'Duration must be at least 30 minutes']
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
      default: 'confirmed'
    },
    checkInTime: {
      type: Date
    },
    checkOutTime: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high performance interval conflict queries
reservationSchema.index({ parkingSlot: 1, status: 1, startTime: 1, endTime: 1 });
reservationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Reservation', reservationSchema);
