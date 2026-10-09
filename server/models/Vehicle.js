const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vehicle owner is required']
    },
    registrationNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9\s-]{4,15}$/, 'Please provide a valid registration plate number']
    },
    vehicleType: {
      type: String,
      enum: ['two-wheeler', 'four-wheeler', 'accessible'],
      default: 'four-wheeler',
      required: true
    },
    model: {
      type: String,
      trim: true,
      default: ''
    },
    color: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes
vehicleSchema.index({ owner: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
