const ParkingSlot = require('../models/ParkingSlot');
const Reservation = require('../models/Reservation');

// @desc    Get all parking slots (with dynamic interval availability check)
// @route   GET /api/slots
// @access  Public (or authenticated)
exports.getAllSlots = async (req, res, next) => {
  try {
    const { section, slotType, status, search, startTime, endTime } = req.query;

    let query = {};

    if (section && section !== 'all') {
      query.section = section;
    }

    if (slotType && slotType !== 'all') {
      query.slotType = slotType;
    }

    if (search) {
      query.$or = [
        { slotNumber: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } }
      ];
    }

    const slots = await ParkingSlot.find(query).sort({ slotNumber: 1 });

    // Determine interval for availability calculation
    const now = new Date();
    const queryStart = startTime ? new Date(startTime) : now;
    // Default interval window is 2 hours from start if endTime not provided
    const queryEnd = endTime ? new Date(endTime) : new Date(queryStart.getTime() + 2 * 60 * 60 * 1000);

    // Fetch active/confirmed/pending reservations overlapping with the requested interval
    const activeReservations = await Reservation.find({
      status: { $in: ['confirmed', 'active', 'pending'] },
      startTime: { $lt: queryEnd },
      endTime: { $gt: queryStart }
    }).populate('vehicle', 'registrationNumber vehicleType model')
      .populate('user', 'name email');

    // Create a map of slotId -> reservation
    const conflictMap = new Map();
    activeReservations.forEach(res => {
      conflictMap.set(res.parkingSlot.toString(), res);
    });

    // Compute dynamic status for each slot
    const slotsWithDynamicStatus = slots.map(slot => {
      const slotObj = slot.toObject();

      if (slot.isUnderMaintenance || slot.status === 'maintenance') {
        slotObj.calculatedStatus = 'maintenance';
      } else if (conflictMap.has(slot._id.toString())) {
        const matchingRes = conflictMap.get(slot._id.toString());
        // If reservation is already checked-in and active right now, mark occupied; otherwise reserved
        if (matchingRes.status === 'active' || (matchingRes.startTime <= now && matchingRes.endTime > now)) {
          slotObj.calculatedStatus = 'occupied';
        } else {
          slotObj.calculatedStatus = 'reserved';
        }
        slotObj.currentReservation = {
          id: matchingRes._id,
          bookingReference: matchingRes.bookingReference,
          startTime: matchingRes.startTime,
          endTime: matchingRes.endTime,
          vehiclePlate: matchingRes.vehicle ? matchingRes.vehicle.registrationNumber : 'N/A'
        };
      } else {
        slotObj.calculatedStatus = 'available';
      }

      // Filter by requested status if specified
      return slotObj;
    });

    let finalSlots = slotsWithDynamicStatus;
    if (status && status !== 'all') {
      finalSlots = finalSlots.filter(s => s.calculatedStatus === status);
    }

    // Also collect distinct sections for filtering
    const sections = await ParkingSlot.distinct('section');

    res.status(200).json({
      success: true,
      count: finalSlots.length,
      queryInterval: {
        startTime: queryStart,
        endTime: queryEnd
      },
      sections,
      data: finalSlots
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single parking slot by ID
// @route   GET /api/slots/:id
// @access  Public
exports.getSlotById = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }

    const now = new Date();
    // Get upcoming reservations for this slot (next 7 days)
    const upcomingReservations = await Reservation.find({
      parkingSlot: slot._id,
      status: { $in: ['confirmed', 'active'] },
      endTime: { $gte: now }
    })
      .populate('vehicle', 'registrationNumber vehicleType')
      .populate('user', 'name')
      .sort({ startTime: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        ...slot.toObject(),
        upcomingReservations
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new parking slot
// @route   POST /api/slots
// @access  Private/Admin
exports.createSlot = async (req, res, next) => {
  try {
    const { slotNumber, slotType, section, basePricePerHour, description, status } = req.body;

    if (!slotNumber || !section) {
      return res.status(400).json({
        success: false,
        message: 'Slot number and section are required.'
      });
    }

    const existing = await ParkingSlot.findOne({ slotNumber: slotNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Slot number '${slotNumber.toUpperCase().trim()}' already exists.`
      });
    }

    const slot = await ParkingSlot.create({
      slotNumber: slotNumber.toUpperCase().trim(),
      slotType: slotType || 'four-wheeler',
      section: section.trim(),
      basePricePerHour: Number(basePricePerHour) || 20,
      description: description || '',
      status: status || 'available',
      isUnderMaintenance: status === 'maintenance'
    });

    res.status(201).json({
      success: true,
      message: 'Parking slot created successfully.',
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update parking slot
// @route   PUT /api/slots/:id
// @access  Private/Admin
exports.updateSlot = async (req, res, next) => {
  try {
    const { slotNumber, slotType, section, basePricePerHour, description, status, isUnderMaintenance } = req.body;

    let slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }

    // Check slot number uniqueness if changed
    if (slotNumber && slotNumber.toUpperCase().trim() !== slot.slotNumber) {
      const duplicate = await ParkingSlot.findOne({ slotNumber: slotNumber.toUpperCase().trim() });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Slot number '${slotNumber.toUpperCase().trim()}' already exists.`
        });
      }
      slot.slotNumber = slotNumber.toUpperCase().trim();
    }

    if (slotType) slot.slotType = slotType;
    if (section) slot.section = section.trim();
    if (basePricePerHour !== undefined) slot.basePricePerHour = Number(basePricePerHour);
    if (description !== undefined) slot.description = description;
    if (status) {
      slot.status = status;
      if (status === 'maintenance') slot.isUnderMaintenance = true;
      if (status === 'available') slot.isUnderMaintenance = false;
    }
    if (isUnderMaintenance !== undefined) {
      slot.isUnderMaintenance = isUnderMaintenance;
      if (isUnderMaintenance) slot.status = 'maintenance';
    }

    await slot.save();

    res.status(200).json({
      success: true,
      message: 'Parking slot updated successfully.',
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete parking slot
// @route   DELETE /api/slots/:id
// @access  Private/Admin
exports.deleteSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }

    // Check if slot has active or future confirmed reservations
    const now = new Date();
    const activeBooking = await Reservation.findOne({
      parkingSlot: slot._id,
      status: { $in: ['confirmed', 'active'] },
      endTime: { $gt: now }
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete parking slot with active or upcoming reservations. Please cancel or reassign them first.'
      });
    }

    await ParkingSlot.findByIdAndDelete(slot._id);

    res.status(200).json({
      success: true,
      message: 'Parking slot deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
