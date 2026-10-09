const ParkingSlot = require('../models/ParkingSlot');
const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @desc    Get Admin Dashboard metrics & charts
// @route   GET /api/dashboard/admin
// @access  Private/Admin
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    // 1. Overall counts
    const totalSlots = await ParkingSlot.countDocuments();
    const maintenanceSlots = await ParkingSlot.countDocuments({
      $or: [{ status: 'maintenance' }, { isUnderMaintenance: true }]
    });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalVehicles = await Vehicle.countDocuments();

    // 2. Active reservations right now (status active OR confirmed within current time)
    const activeReservationsCount = await Reservation.countDocuments({
      status: { $in: ['active', 'confirmed'] },
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    // 3. Occupied slots right now
    const occupiedSlotIds = await Reservation.distinct('parkingSlot', {
      status: { $in: ['active', 'confirmed'] },
      startTime: { $lte: now },
      endTime: { $gte: now }
    });
    const occupiedSlotsCount = occupiedSlotIds.length;

    // Available slots right now = totalSlots - occupied - maintenance
    const availableSlotsCount = Math.max(0, totalSlots - occupiedSlotsCount - maintenanceSlots);

    // 4. Reservation Status Breakdown
    const statusCounts = await Reservation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const statusBreakdown = {
      pending: 0,
      confirmed: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    statusCounts.forEach(item => {
      if (statusBreakdown[item._id] !== undefined) {
        statusBreakdown[item._id] = item.count;
      }
      if (item._id !== 'cancelled') {
        statusBreakdown.totalRevenue += item.totalRevenue || 0;
      }
    });

    // 5. Slot Distribution by Type
    const slotTypeDistribution = await ParkingSlot.aggregate([
      {
        $group: {
          _id: '$slotType',
          count: { $sum: 1 }
        }
      }
    ]);

    // 6. Section Utilization
    const allSlots = await ParkingSlot.find();
    const sectionStatsMap = {};
    allSlots.forEach(slot => {
      const sec = slot.section;
      if (!sectionStatsMap[sec]) {
        sectionStatsMap[sec] = { section: sec, total: 0, occupied: 0, available: 0, maintenance: 0 };
      }
      sectionStatsMap[sec].total += 1;
      if (slot.isUnderMaintenance || slot.status === 'maintenance') {
        sectionStatsMap[sec].maintenance += 1;
      } else if (occupiedSlotIds.some(id => id.toString() === slot._id.toString())) {
        sectionStatsMap[sec].occupied += 1;
      } else {
        sectionStatsMap[sec].available += 1;
      }
    });

    const sectionUtilization = Object.values(sectionStatsMap);

    // 7. Recent 8 bookings
    const recentBookings = await Reservation.find()
      .populate('parkingSlot', 'slotNumber slotType section')
      .populate('vehicle', 'registrationNumber vehicleType model')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(8);

    // 8. Daily reservation trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrends = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSlots,
          availableSlots: availableSlotsCount,
          occupiedSlots: occupiedSlotsCount,
          maintenanceSlots,
          activeReservations: activeReservationsCount,
          totalUsers,
          totalVehicles,
          totalRevenue: statusBreakdown.totalRevenue
        },
        statusBreakdown,
        slotTypeDistribution: slotTypeDistribution.map(d => ({
          name: d._id.replace('-', ' ').toUpperCase(),
          value: d.count
        })),
        sectionUtilization,
        recentBookings,
        dailyTrends: dailyTrends.map(d => ({
          date: d._id,
          bookings: d.bookings,
          revenue: d.revenue
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get User Dashboard metrics
// @route   GET /api/dashboard/user
// @access  Private
exports.getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // User's vehicles
    const vehicles = await Vehicle.find({ owner: userId }).sort({ createdAt: -1 });

    // Active reservation right now
    const activeReservation = await Reservation.findOne({
      user: userId,
      status: { $in: ['active', 'confirmed'] },
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
      .populate('parkingSlot', 'slotNumber slotType section')
      .populate('vehicle', 'registrationNumber model');

    // Upcoming reservations
    const upcomingReservations = await Reservation.find({
      user: userId,
      status: 'confirmed',
      startTime: { $gt: now }
    })
      .populate('parkingSlot', 'slotNumber slotType section')
      .populate('vehicle', 'registrationNumber model')
      .sort({ startTime: 1 })
      .limit(5);

    // Recent past reservations
    const recentHistory = await Reservation.find({
      user: userId,
      status: { $in: ['completed', 'cancelled'] }
    })
      .populate('parkingSlot', 'slotNumber slotType section')
      .populate('vehicle', 'registrationNumber model')
      .sort({ createdAt: -1 })
      .limit(5);

    // Total stats for this user
    const totalReservations = await Reservation.countDocuments({ user: userId });
    const completedReservations = await Reservation.countDocuments({ user: userId, status: 'completed' });

    // Available slots right now across the campus
    const totalSlots = await ParkingSlot.countDocuments({
      isUnderMaintenance: { $ne: true },
      status: { $ne: 'maintenance' }
    });
    const occupiedSlotIds = await Reservation.distinct('parkingSlot', {
      status: { $in: ['active', 'confirmed'] },
      startTime: { $lte: now },
      endTime: { $gte: now }
    });
    const liveAvailableSlots = Math.max(0, totalSlots - occupiedSlotIds.length);

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone
        },
        stats: {
          liveAvailableSlots,
          totalSlots,
          userVehiclesCount: vehicles.length,
          totalBookingsCount: totalReservations,
          completedBookingsCount: completedReservations
        },
        activeReservation,
        upcomingReservations,
        recentHistory,
        vehicles
      }
    });
  } catch (error) {
    next(error);
  }
};
