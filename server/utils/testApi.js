const http = require('http');

// Helper to make HTTP requests
const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log(' STARTING SMART PARKING FULL-STACK API TEST SUITE   ');
  console.log('====================================================');

  const baseUrl = { hostname: 'localhost', port: 5000 };

  try {
    // 1. Health check
    const health = await request({ ...baseUrl, path: '/api/health', method: 'GET' });
    console.log(`[1] Health Check: Status ${health.status} => ${health.body.status || 'OK'}`);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Admin Login
    const adminLogin = await request(
      {
        ...baseUrl,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'admin@smartparking.edu', password: 'Admin@12345' }
    );
    console.log(`[2] Admin Login: Status ${adminLogin.status} => ${adminLogin.body.user?.name} (Role: ${adminLogin.body.user?.role})`);
    if (adminLogin.status !== 200 || !adminLogin.body.token) throw new Error('Admin login failed');
    const adminToken = adminLogin.body.token;

    // 3. User Login
    const userLogin = await request(
      {
        ...baseUrl,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'john.doe@smartparking.edu', password: 'User@12345' }
    );
    console.log(`[3] User Login: Status ${userLogin.status} => ${userLogin.body.user?.name} (Role: ${userLogin.body.user?.role})`);
    if (userLogin.status !== 200 || !userLogin.body.token) throw new Error('User login failed');
    const userToken = userLogin.body.token;

    // 4. Test Registration of new student
    const testEmail = `student_${Date.now()}@smartparking.edu`;
    const regRes = await request(
      {
        ...baseUrl,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Hackathon Tester',
        email: testEmail,
        password: 'Password@123',
        phone: '+91 9998887776'
      }
    );
    console.log(`[4] User Registration: Status ${regRes.status} => Created: ${regRes.body.user?.name}`);
    if (regRes.status !== 201) throw new Error('User registration failed');
    const newStudentToken = regRes.body.token;

    // 5. Test Register Vehicle for new student
    const testPlate = `DL-01-HK-${Math.floor(1000 + Math.random() * 9000)}`;
    const vehRes = await request(
      {
        ...baseUrl,
        path: '/api/vehicles',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newStudentToken}`
        }
      },
      {
        registrationNumber: testPlate,
        vehicleType: 'four-wheeler',
        model: 'Tata Nexon EV',
        color: 'Daytona Grey'
      }
    );
    console.log(`[5] Vehicle Registration: Status ${vehRes.status} => Plate: ${vehRes.body.data?.registrationNumber}`);
    if (vehRes.status !== 201) throw new Error('Vehicle registration failed');
    const registeredVehicleId = vehRes.body.data._id;

    // 6. Test Slots Fetching
    const slotsRes = await request({ ...baseUrl, path: '/api/slots', method: 'GET' });
    console.log(`[6] Get Parking Slots: Status ${slotsRes.status} => Found ${slotsRes.body.count} slots across ${slotsRes.body.sections?.length} sections`);
    if (slotsRes.status !== 200 || slotsRes.body.count === 0) throw new Error('Slots fetch failed');

    // Pick an available four-wheeler slot (e.g. C-08 or A-07)
    const targetSlot = slotsRes.body.data.find(s => s.calculatedStatus === 'available' && s.slotType === 'four-wheeler');
    if (!targetSlot) throw new Error('No available slot found for testing booking');
    console.log(`    Selected Slot: ${targetSlot.slotNumber} (${targetSlot.section})`);

    // 7. Test Slot Availability Check
    const startTime = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(); // 5 hours from now
    const endTime = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();   // 8 hours from now
    const availCheck = await request({
      ...baseUrl,
      path: `/api/reservations/availability?slotId=${targetSlot._id}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
      method: 'GET'
    });
    console.log(`[7] Check Availability: Status ${availCheck.status} => isAvailable: ${availCheck.body.isAvailable}`);
    if (!availCheck.body.isAvailable) throw new Error('Slot should be available before booking');

    // 8. Test Create Reservation
    const bookingRes = await request(
      {
        ...baseUrl,
        path: '/api/reservations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newStudentToken}`
        }
      },
      {
        parkingSlotId: targetSlot._id,
        vehicleId: registeredVehicleId,
        startTime,
        endTime
      }
    );
    console.log(`[8] Create Reservation: Status ${bookingRes.status} => Ref: ${bookingRes.body.data?.bookingReference}, Status: ${bookingRes.body.data?.status}, Amount: ₹${bookingRes.body.data?.totalAmount}`);
    if (bookingRes.status !== 201) throw new Error('Reservation creation failed');
    const createdBookingId = bookingRes.body.data._id;

    // 9. CRITICAL TEST: Conflict Prevention (Attempt double booking on same slot overlapping window)
    const johnVehicles = await request({
      ...baseUrl,
      path: '/api/vehicles',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const johnVehicleId = johnVehicles.body.data[0]._id;

    const overlappingStart = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // Overlaps between 5h and 8h!
    const overlappingEnd = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();
    const conflictRes = await request(
      {
        ...baseUrl,
        path: '/api/reservations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}` // John Doe attempts to book the same slot
        }
      },
      {
        parkingSlotId: targetSlot._id,
        vehicleId: johnVehicleId,
        startTime: overlappingStart,
        endTime: overlappingEnd
      }
    );
    console.log(`[9] Overlap Conflict Prevention Test: Status ${conflictRes.status} (Expected: 409 Conflict)`);
    if (conflictRes.status === 409) {
      console.log(`    ✓ SUCCESS: Server properly rejected conflicting booking with HTTP 409 Conflict: "${conflictRes.body.message}"`);
    } else {
      throw new Error(`Expected 409 conflict but received ${conflictRes.status}`);
    }

    // 10. Test Cancel Reservation & Release Slot
    const cancelRes = await request(
      {
        ...baseUrl,
        path: `/api/reservations/${createdBookingId}/cancel`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newStudentToken}`
        }
      },
      { cancellationReason: 'Test completed' }
    );
    console.log(`[10] Cancel Reservation: Status ${cancelRes.status} => New Status: ${cancelRes.body.data?.status}`);
    if (cancelRes.status !== 200 || cancelRes.body.data?.status !== 'cancelled') throw new Error('Cancellation failed');

    // 11. Test Admin Dashboard Calculations
    const adminDash = await request({
      ...baseUrl,
      path: '/api/dashboard/admin',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`[11] Admin Dashboard: Status ${adminDash.status} => Total Slots: ${adminDash.body.data?.summary?.totalSlots}, Revenue: ₹${adminDash.body.data?.summary?.totalRevenue}`);
    if (adminDash.status !== 200) throw new Error('Admin dashboard failed');

    // 12. Test User Dashboard
    const userDash = await request({
      ...baseUrl,
      path: '/api/dashboard/user',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log(`[12] User Dashboard: Status ${userDash.status} => Campus Available Slots: ${userDash.body.data?.stats?.liveAvailableSlots}`);
    if (userDash.status !== 200) throw new Error('User dashboard failed');

    console.log('====================================================');
    console.log(' ALL 12 API & SECURITY TESTS PASSED PERFECTLY!       ');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  }
};

runTests();
