const Vehicle = require('../models/Vehicle');
const Reservation = require('../models/Reservation');

// @desc    Get vehicles (Users get their own; Admin gets all or filtered)
// @route   GET /api/vehicles
// @access  Private
exports.getVehicles = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role !== 'admin') {
      // Normal users only see their own vehicles
      query.owner = req.user._id;
    } else {
      // Admin can filter by specific user if requested
      if (req.query.userId) {
        query.owner = req.query.userId;
      }
    }

    if (req.query.type && req.query.type !== 'all') {
      query.vehicleType = req.query.type;
    }

    if (req.query.search) {
      query.$or = [
        { registrationNumber: { $regex: req.query.search, $options: 'i' } },
        { model: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private
exports.getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'name email phone');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && vehicle.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this vehicle.' });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new vehicle
// @route   POST /api/vehicles
// @access  Private
exports.createVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, vehicleType, model, color, ownerId } = req.body;

    if (!registrationNumber || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Registration number and vehicle type are required.'
      });
    }

    const cleanPlate = registrationNumber.toUpperCase().trim();

    // Check for duplicate plate in database
    const existing = await Vehicle.findOne({ registrationNumber: cleanPlate });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Vehicle with registration number '${cleanPlate}' is already registered.`
      });
    }

    // Owner is either requested user (if admin) or authenticated user
    let assignedOwner = req.user._id;
    if (req.user.role === 'admin' && ownerId) {
      assignedOwner = ownerId;
    }

    const vehicle = await Vehicle.create({
      owner: assignedOwner,
      registrationNumber: cleanPlate,
      vehicleType,
      model: model ? model.trim() : '',
      color: color ? color.trim() : ''
    });

    const populatedVehicle = await Vehicle.findById(vehicle._id).populate('owner', 'name email');

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      data: populatedVehicle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
// @access  Private
exports.updateVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, vehicleType, model, color } = req.body;

    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this vehicle.' });
    }

    if (registrationNumber) {
      const cleanPlate = registrationNumber.toUpperCase().trim();
      if (cleanPlate !== vehicle.registrationNumber) {
        const duplicate = await Vehicle.findOne({ registrationNumber: cleanPlate });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: `Vehicle with registration number '${cleanPlate}' is already registered.`
          });
        }
        vehicle.registrationNumber = cleanPlate;
      }
    }

    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (model !== undefined) vehicle.model = model.trim();
    if (color !== undefined) vehicle.color = color.trim();

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this vehicle.' });
    }

    // Check if vehicle has active or upcoming reservations
    const now = new Date();
    const activeBooking = await Reservation.findOne({
      vehicle: vehicle._id,
      status: { $in: ['confirmed', 'active'] },
      endTime: { $gt: now }
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle associated with active or upcoming reservations.'
      });
    }

    await Vehicle.findByIdAndDelete(vehicle._id);

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
