const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');
const Vehicle = require('../models/Vehicle');
const Reservation = require('../models/Reservation');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_parking_db';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Connected to database: ${mongoUri}`);

    // Clear existing collections
    await Reservation.deleteMany({});
    await Vehicle.deleteMany({});
    await ParkingSlot.deleteMany({});
    await User.deleteMany({});
    console.log('[Seed] Cleared existing data.');

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@12345', salt);
    const userPasswordHash = await bcrypt.hash('User@12345', salt);

    const admin = await User.create({
      name: 'Campus Admin',
      email: 'admin@smartparking.edu',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '+91 9876543210'
    });

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john.doe@smartparking.edu',
      passwordHash: userPasswordHash,
      role: 'user',
      phone: '+91 9123456789'
    });

    const user2 = await User.create({
      name: 'Dr. Sarah Faculty',
      email: 'sarah.faculty@smartparking.edu',
      passwordHash: userPasswordHash,
      role: 'user',
      phone: '+91 9832145670'
    });

    const user3 = await User.create({
      name: 'Mike Student',
      email: 'mike.student@smartparking.edu',
      passwordHash: userPasswordHash,
      role: 'user',
      phone: '+91 9988776655'
    });

    console.log('[Seed] Created 4 Users (1 Admin, 3 Users).');

    // 2. Create Parking Slots
    const slotsData = [
      // Section A: Ground Floor - North Wing
      { slotNumber: 'A-01', slotType: 'four-wheeler', section: 'Ground Floor - Section A', basePricePerHour: 30, status: 'available' },
      { slotNumber: 'A-02', slotType: 'four-wheeler', section: 'Ground Floor - Section A', basePricePerHour: 30, status: 'available' },
      { slotNumber: 'A-03', slotType: 'accessible',   section: 'Ground Floor - Section A', basePricePerHour: 20, status: 'available' },
      { slotNumber: 'A-04', slotType: 'accessible',   section: 'Ground Floor - Section A', basePricePerHour: 20, status: 'available' },
      { slotNumber: 'A-05', slotType: 'two-wheeler',  section: 'Ground Floor - Section A', basePricePerHour: 15, status: 'available' },
      { slotNumber: 'A-06', slotType: 'two-wheeler',  section: 'Ground Floor - Section A', basePricePerHour: 15, status: 'available' },
      { slotNumber: 'A-07', slotType: 'four-wheeler', section: 'Ground Floor - Section A', basePricePerHour: 30, status: 'available' },
      { slotNumber: 'A-08', slotType: 'four-wheeler', section: 'Ground Floor - Section A', basePricePerHour: 30, status: 'maintenance', isUnderMaintenance: true, description: 'EV Charger repaving' },

      // Section B: Basement 1 - South Wing
      { slotNumber: 'B-01', slotType: 'four-wheeler', section: 'Basement 1 - Section B', basePricePerHour: 25, status: 'available' },
      { slotNumber: 'B-02', slotType: 'four-wheeler', section: 'Basement 1 - Section B', basePricePerHour: 25, status: 'available' },
      { slotNumber: 'B-03', slotType: 'four-wheeler', section: 'Basement 1 - Section B', basePricePerHour: 25, status: 'available' },
      { slotNumber: 'B-04', slotType: 'four-wheeler', section: 'Basement 1 - Section B', basePricePerHour: 25, status: 'available' },
      { slotNumber: 'B-05', slotType: 'two-wheeler',  section: 'Basement 1 - Section B', basePricePerHour: 10, status: 'available' },
      { slotNumber: 'B-06', slotType: 'two-wheeler',  section: 'Basement 1 - Section B', basePricePerHour: 10, status: 'available' },
      { slotNumber: 'B-07', slotType: 'two-wheeler',  section: 'Basement 1 - Section B', basePricePerHour: 10, status: 'available' },
      { slotNumber: 'B-08', slotType: 'accessible',   section: 'Basement 1 - Section B', basePricePerHour: 15, status: 'available' },

      // Section C: Basement 2 - Tech & Faculty
      { slotNumber: 'C-01', slotType: 'four-wheeler', section: 'Basement 2 - Section C', basePricePerHour: 20, status: 'available' },
      { slotNumber: 'C-02', slotType: 'four-wheeler', section: 'Basement 2 - Section C', basePricePerHour: 20, status: 'available' },
      { slotNumber: 'C-03', slotType: 'four-wheeler', section: 'Basement 2 - Section C', basePricePerHour: 20, status: 'available' },
      { slotNumber: 'C-04', slotType: 'four-wheeler', section: 'Basement 2 - Section C', basePricePerHour: 20, status: 'available' },
      { slotNumber: 'C-05', slotType: 'two-wheeler',  section: 'Basement 2 - Section C', basePricePerHour: 10, status: 'available' },
      { slotNumber: 'C-06', slotType: 'two-wheeler',  section: 'Basement 2 - Section C', basePricePerHour: 10, status: 'available' },
      { slotNumber: 'C-07', slotType: 'accessible',   section: 'Basement 2 - Section C', basePricePerHour: 15, status: 'available' },
      { slotNumber: 'C-08', slotType: 'four-wheeler', section: 'Basement 2 - Section C', basePricePerHour: 20, status: 'available' }
    ];

    const createdSlots = await ParkingSlot.insertMany(slotsData);
    console.log(`[Seed] Created ${createdSlots.length} Parking Slots.`);

    // 3. Create Vehicles
    const v1 = await Vehicle.create({
      owner: user1._id,
      registrationNumber: 'KA-01-MJ-2024',
      vehicleType: 'four-wheeler',
      model: 'Hyundai Creta',
      color: 'Polar White'
    });

    const v2 = await Vehicle.create({
      owner: user1._id,
      registrationNumber: 'KA-05-BK-7788',
      vehicleType: 'two-wheeler',
      model: 'Royal Enfield Classic 350',
      color: 'Stealth Black'
    });

    const v3 = await Vehicle.create({
      owner: user2._id,
      registrationNumber: 'MH-12-AB-4321',
      vehicleType: 'four-wheeler',
      model: 'Honda City ZX',
      color: 'Radiant Red'
    });

    const v4 = await Vehicle.create({
      owner: user2._id,
      registrationNumber: 'TS-07-EA-1122',
      vehicleType: 'accessible',
      model: 'Maruti Suzuki Brezza (Adapted)',
      color: 'Silver Metallic'
    });

    const v5 = await Vehicle.create({
      owner: user3._id,
      registrationNumber: 'DL-04-XY-9876',
      vehicleType: 'two-wheeler',
      model: 'Yamaha R15 V4',
      color: 'Racing Blue'
    });

    console.log('[Seed] Created 5 Registered Vehicles.');

    // 4. Create Reservations
    const now = new Date();

    // Reservation 1: Active RIGHT NOW on A-01 (Occupied)
    const activeStart = new Date(now.getTime() - 45 * 60 * 1000); // started 45 mins ago
    const activeEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // ends in 2 hours
    await Reservation.create({
      bookingReference: 'PK-20261009-ACT1',
      user: user1._id,
      vehicle: v1._id,
      parkingSlot: createdSlots[0]._id, // A-01
      bookingDate: activeStart,
      startTime: activeStart,
      endTime: activeEnd,
      durationHours: 2.75,
      totalAmount: 83,
      status: 'active',
      checkInTime: activeStart
    });

    // Reservation 2: Active RIGHT NOW on B-05 (Two-wheeler occupied)
    const activeStart2 = new Date(now.getTime() - 20 * 60 * 1000);
    const activeEnd2 = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
    await Reservation.create({
      bookingReference: 'PK-20261009-ACT2',
      user: user3._id,
      vehicle: v5._id,
      parkingSlot: createdSlots[12]._id, // B-05
      bookingDate: activeStart2,
      startTime: activeStart2,
      endTime: activeEnd2,
      durationHours: 1.8,
      totalAmount: 18,
      status: 'active',
      checkInTime: activeStart2
    });

    // Reservation 3: Upcoming Confirmed tomorrow morning on A-02
    const upcomingStart = new Date(now.getTime() + 18 * 60 * 60 * 1000);
    const upcomingEnd = new Date(upcomingStart.getTime() + 4 * 60 * 60 * 1000);
    await Reservation.create({
      bookingReference: 'PK-20261010-CONF1',
      user: user2._id,
      vehicle: v3._id,
      parkingSlot: createdSlots[1]._id, // A-02
      bookingDate: upcomingStart,
      startTime: upcomingStart,
      endTime: upcomingEnd,
      durationHours: 4,
      totalAmount: 120,
      status: 'confirmed'
    });

    // Reservation 4: Upcoming Confirmed later today on A-03 (Accessible)
    const upcomingStart2 = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const upcomingEnd2 = new Date(upcomingStart2.getTime() + 3 * 60 * 60 * 1000);
    await Reservation.create({
      bookingReference: 'PK-20261009-CONF2',
      user: user2._id,
      vehicle: v4._id,
      parkingSlot: createdSlots[2]._id, // A-03
      bookingDate: upcomingStart2,
      startTime: upcomingStart2,
      endTime: upcomingEnd2,
      durationHours: 3,
      totalAmount: 60,
      status: 'confirmed'
    });

    // Reservation 5: Completed past booking yesterday on C-01
    const pastStart = new Date(now.getTime() - 26 * 60 * 60 * 1000);
    const pastEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000);
    await Reservation.create({
      bookingReference: 'PK-20261008-COMP1',
      user: user1._id,
      vehicle: v1._id,
      parkingSlot: createdSlots[16]._id, // C-01
      bookingDate: pastStart,
      startTime: pastStart,
      endTime: pastEnd,
      durationHours: 3,
      totalAmount: 60,
      status: 'completed',
      checkInTime: pastStart,
      checkOutTime: pastEnd
    });

    // Reservation 6: Completed past booking 2 days ago on B-01
    const pastStart2 = new Date(now.getTime() - 50 * 60 * 60 * 1000);
    const pastEnd2 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    await Reservation.create({
      bookingReference: 'PK-20261007-COMP2',
      user: user2._id,
      vehicle: v3._id,
      parkingSlot: createdSlots[8]._id, // B-01
      bookingDate: pastStart2,
      startTime: pastStart2,
      endTime: pastEnd2,
      durationHours: 2,
      totalAmount: 50,
      status: 'completed',
      checkInTime: pastStart2,
      checkOutTime: pastEnd2
    });

    // Reservation 7: Cancelled booking
    const cancelStart = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    const cancelEnd = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    await Reservation.create({
      bookingReference: 'PK-20261008-CANC1',
      user: user1._id,
      vehicle: v2._id,
      parkingSlot: createdSlots[4]._id, // A-05
      bookingDate: cancelStart,
      startTime: cancelStart,
      endTime: cancelEnd,
      durationHours: 2,
      totalAmount: 30,
      status: 'cancelled',
      cancelledAt: new Date(cancelStart.getTime() - 60 * 60 * 1000),
      cancellationReason: 'Class rescheduled to online mode'
    });

    console.log('[Seed] Created 7 Realistic Reservations.');
    console.log('====================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY!                    ');
    console.log(' Demo Credentials:                                  ');
    console.log(' Admin: admin@smartparking.edu / Admin@12345        ');
    console.log(' User:  john.doe@smartparking.edu / User@12345      ');
    console.log(' User:  sarah.faculty@smartparking.edu / User@12345 ');
    console.log(' User:  mike.student@smartparking.edu / User@12345  ');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedData();
