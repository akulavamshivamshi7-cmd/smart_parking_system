const User = require('../models/User');
const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');

// @desc    Get all registered users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    let query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    // Attach booking and vehicle counts for each user
    const usersWithStats = await Promise.all(
      users.map(async user => {
        const bookingsCount = await Reservation.countDocuments({ user: user._id });
        const vehiclesCount = await Vehicle.countDocuments({ owner: user._id });
        return {
          ...user.toJSON(),
          bookingsCount,
          vehiclesCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithStats.length,
      data: usersWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const vehicles = await Vehicle.find({ owner: user._id });
    const reservations = await Reservation.find({ user: user._id })
      .populate('parkingSlot', 'slotNumber section')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        user,
        vehicles,
        reservations
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be user or admin.' });
    }

    // Prevent demoting the only remaining admin
    if (req.params.id === req.user.id && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only remaining administrator.'
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Administrators cannot delete their own account.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Delete associated vehicles and clean up reservations
    await Vehicle.deleteMany({ owner: user._id });
    await Reservation.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'User and all related records deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
