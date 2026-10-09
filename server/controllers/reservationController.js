const Reservation = require('../models/Reservation');
const ParkingSlot = require('../models/ParkingSlot');
const Vehicle = require('../models/Vehicle');
const crypto = require('crypto');

// Generate unique booking reference: PK-YYYYMMDD-XXXX
const generateBookingReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PK-${dateStr}-${randomSuffix}`;
};

// @desc    Check slot availability for a specified time interval
// @route   GET /api/reservations/availability
// @access  Public
exports.checkAvailability = async (req, res, next) => {
  try {
    const { slotId, startTime, endTime } = req.query;

    if (!slotId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide slotId, startTime, and endTime query parameters.'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date format.' });
    }

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End time must be after start time.' });
    }

    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }

    if (slot.isUnderMaintenance || slot.status === 'maintenance') {
      return res.status(200).json({
        success: true,
        isAvailable: false,
        reason: 'Slot is currently under maintenance.'
      });
    }

    // Overlapping condition: (existing.startTime < requestedEnd) && (existing.endTime > requestedStart)
    const conflictingReservation = await Reservation.findOne({
      parkingSlot: slotId,
      status: { $in: ['confirmed', 'active', 'pending'] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    }).populate('vehicle', 'registrationNumber');

    if (conflictingReservation) {
      return res.status(200).json({
        success: true,
        isAvailable: false,
        reason: `Slot is already booked from ${new Date(conflictingReservation.startTime).toLocaleTimeString()} to ${new Date(conflictingReservation.endTime).toLocaleTimeString()}.`,
        conflictingBooking: {
          reference: conflictingReservation.bookingReference,
          startTime: conflictingReservation.startTime,
          endTime: conflictingReservation.endTime
        }
      });
    }

    res.status(200).json({
      success: true,
      isAvailable: true,
      slot: {
        id: slot._id,
        slotNumber: slot.slotNumber,
        slotType: slot.slotType,
        section: slot.section,
        basePricePerHour: slot.basePricePerHour
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new parking reservation
// @route   POST /api/reservations
// @access  Private
exports.createReservation = async (req, res, next) => {
  try {
    const { parkingSlotId, vehicleId, startTime, endTime, bookingDate } = req.body;

    if (!parkingSlotId || !vehicleId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide parkingSlotId, vehicleId, startTime, and endTime.'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date time format.' });
    }

    // Prevent bookings in the past (allow small 10 minute tolerance for network/typing latency)
    if (start.getTime() < now.getTime() - 10 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book reservations in the past. Please select a future start time.'
      });
    }

    // Minimum reservation: 30 minutes
    const durationMs = end.getTime() - start.getTime();
    if (durationMs < 30 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'End time must be at least 30 minutes after start time.'
      });
    }

    // Check parking slot existence
    const slot = await ParkingSlot.findById(parkingSlotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Selected parking slot does not exist.' });
    }

    if (slot.isUnderMaintenance || slot.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'This parking slot is currently under maintenance and cannot be reserved.'
      });
    }

    // Check vehicle existence and ownership
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Selected vehicle not found.' });
    }

    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to make a reservation with this vehicle.'
      });
    }

    // Check slot type compatibility
    if (slot.slotType === 'two-wheeler' && vehicle.vehicleType !== 'two-wheeler') {
      return res.status(400).json({
        success: false,
        message: 'A four-wheeler or standard vehicle cannot book a two-wheeler slot.'
      });
    }

    // CRITICAL: Overlap conflict check (Atomic safeguard)
    const existingConflict = await Reservation.findOne({
      parkingSlot: parkingSlotId,
      status: { $in: ['confirmed', 'active', 'pending'] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Slot ${slot.slotNumber} is already reserved between ${new Date(existingConflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and ${new Date(existingConflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please choose another slot or time.`
      });
    }

    // Calculate duration in hours (rounded to 1 decimal place) and total price
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
    const totalAmount = Math.round(durationHours * (slot.basePricePerHour || 20));

    // Generate unique reference
    let bookingReference = generateBookingReference();
    let isUnique = false;
    while (!isUnique) {
      const exists = await Reservation.findOne({ bookingReference });
      if (!exists) {
        isUnique = true;
      } else {
        bookingReference = generateBookingReference();
      }
    }

    const reservation = await Reservation.create({
      bookingReference,
      user: req.user._id,
      vehicle: vehicle._id,
      parkingSlot: slot._id,
      bookingDate: bookingDate ? new Date(bookingDate) : new Date(start.toISOString().slice(0, 10)),
      startTime: start,
      endTime: end,
      durationHours,
      totalAmount,
      status: 'confirmed'
    });

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('parkingSlot', 'slotNumber slotType section basePricePerHour')
      .populate('vehicle', 'registrationNumber vehicleType model color')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Parking slot reserved successfully!',
      data: populatedReservation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reservations (Users get their own; Admin gets all with filters)
// @route   GET /api/reservations
// @access  Private
exports.getReservations = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    } else {
      if (req.query.userId) {
        query.user = req.query.userId;
      }
      if (req.query.slotId) {
        query.parkingSlot = req.query.slotId;
      }
    }

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (req.query.search) {
      query.bookingReference = { $regex: req.query.search, $options: 'i' };
    }

    // Filter by date if provided
    if (req.query.date) {
      const targetDate = new Date(req.query.date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const reservations = await Reservation.find(query)
      .populate('parkingSlot', 'slotNumber slotType section basePricePerHour')
      .populate('vehicle', 'registrationNumber vehicleType model color')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reservation by ID
// @route   GET /api/reservations/:id
// @access  Private
exports.getReservationById = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('parkingSlot', 'slotNumber slotType section basePricePerHour')
      .populate('vehicle', 'registrationNumber vehicleType model color')
      .populate('user', 'name email phone');

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    if (req.user.role !== 'admin' && reservation.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this reservation.' });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel reservation
// @route   PATCH /api/reservations/:id/cancel
// @access  Private
exports.cancelReservation = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this reservation.' });
    }

    // Check if cancellation is permitted
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This reservation is already cancelled.' });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Completed reservations cannot be cancelled.' });
    }

    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = cancellationReason || (req.user.role === 'admin' ? 'Cancelled by Administrator' : 'Cancelled by User');

    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully.',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reservation status (Admin or Check-in/Check-out workflow)
// @route   PUT /api/reservations/:id
// @access  Private/Admin
exports.updateReservationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    if (status) {
      reservation.status = status;
      if (status === 'active' && !reservation.checkInTime) {
        reservation.checkInTime = new Date();
      }
      if (status === 'completed' && !reservation.checkOutTime) {
        reservation.checkOutTime = new Date();
      }
      if (status === 'cancelled' && !reservation.cancelledAt) {
        reservation.cancelledAt = new Date();
        reservation.cancellationReason = 'Status updated by Administrator';
      }
    }

    await reservation.save();

    const updated = await Reservation.findById(reservation._id)
      .populate('parkingSlot', 'slotNumber slotType section')
      .populate('vehicle', 'registrationNumber vehicleType')
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: `Reservation status updated to '${status}'.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
