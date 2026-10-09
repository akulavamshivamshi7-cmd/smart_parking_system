# 🚗 ParkSmart - Intelligent Campus Parking Management System (MERN Stack)

> **Built for College Internal Hackathon 2026**  
> A complete, modern, production-grade Smart Parking Management System designed to eliminate campus parking congestion, avoid double-bookings, and provide real-time occupancy telemetry for administrators and drivers.

---

## 🌟 1. Project Overview & Highlights

**ParkSmart** addresses campus vehicle congestion through an automated, conflict-free reservation workflow. Unlike static parking apps that permanently mark slots as booked once reserved, ParkSmart features **dynamic time-interval availability**: slots are evaluated based on the driver's requested start and end timestamps. A slot reserved for tomorrow afternoon remains completely available for drivers parking right now!

### Core Capabilities:
- **Dynamic Slot Availability:** Real-time interval calculations prevent slots from being marked permanently occupied.
- **Atomic Double-Booking Safeguard:** Database queries and server-side validation guarantee that simultaneous overlapping requests receive a `409 Conflict`.
- **Role-Based Access Control (RBAC):** Distinct interfaces and protected REST routes for **Students/Faculty (Users)** and **Campus Facility Managers (Admins)**.
- **Vehicle Type Validation:** Enforces two-wheeler, four-wheeler, and accessible bay compliance to prevent vehicle mismatches.
- **Digital Parking Passes:** Generates instant digital access passes with barcodes, QR codes, and booking references for security checkpoints.
- **Live Visual Grid:** Interactive campus parking lot visualizer with color-coded bay statuses, lane road markings, and quick filters.
- **Real-Time Analytics:** Interactive charts powered by Recharts showing section occupancy breakdown, booking status trends, and campus revenue.

---

## 🛠️ 2. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18 + Vite | Lightning-fast development & optimized production bundles |
| **Styling** | Tailwind CSS 3 | Professional Navy Blue (`#0f172a`) & Teal/Green (`#14b8a6`) visual theme |
| **Icons** | Lucide React | High-clarity iconography throughout all dashboards and badges |
| **Charts** | Recharts 2 | Interactive section occupancy bars and status donut charts |
| **Backend** | Node.js + Express.js | Modular controller-service REST architecture |
| **Database** | MongoDB + Mongoose | Robust document schemas, compound indexes, and aggregation pipelines |
| **Security** | JWT + bcryptjs + Rate-limiting | Salted password hashing, Bearer token verification, brute-force limits |

---

## 📂 3. Project Directory Structure

```text
smart-parking-system/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # Navbar, Sidebar, Modal, ConfirmDialog
│   │   │   └── parking/            # ParkingLotGrid, SlotCard, SlotLegend, BookingModal
│   │   ├── context/                # AuthContext, ToastContext
│   │   ├── layouts/                # DashboardLayout with responsive sidebar
│   │   ├── pages/
│   │   │   ├── admin/              # AdminDashboard, AdminSlots, AdminReservations, AdminVehicles, AdminUsers
│   │   │   ├── user/               # UserDashboard, SlotsBooking, MyReservations, MyVehicles
│   │   │   ├── LandingPage.jsx     # Public landing page with live campus metrics
│   │   │   ├── LoginPage.jsx       # Auth login with 1-click hackathon demo fills
│   │   │   └── RegisterPage.jsx    # User registration form
│   │   ├── services/               # Axios API client with automatic JWT interceptors
│   │   ├── App.jsx                 # Route definitions & protected guards
│   │   ├── main.jsx                # React root mount
│   │   └── index.css               # Tailwind directives & parking bay CSS
│   ├── .env.example
│   └── package.json
├── server/
│   ├── config/                     # MongoDB connection pool (db.js)
│   ├── controllers/                # auth, slot, vehicle, reservation, dashboard, user controllers
│   ├── middleware/                 # auth token verify, role guards, error handler
│   ├── models/                     # User, Vehicle, ParkingSlot, Reservation Mongoose models
│   ├── routes/                     # Express REST routers
│   ├── utils/
│   │   ├── seed.js                 # Realistic seed data script
│   │   └── testApi.js              # Comprehensive 12-test automated integration suite
│   ├── .env.example
│   ├── server.js                   # Express application entrypoint
│   └── package.json
├── package.json                    # Root helper scripts
├── .gitignore
└── README.md
```

---

## 🚀 4. Quick Start & Installation

### Prerequisites:
- **Node.js** (v18 or newer recommended, tested on Node v24)
- **MongoDB** installed locally (running on default port `27017`) or a free **MongoDB Atlas** connection URI.

### Step 1: Clone or Navigate to the Project
```bash
cd smart-parking-system
```

### Step 2: Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/smart_parking_db
JWT_SECRET=supersecret_smart_parking_jwt_key_hackathon_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
*(If using MongoDB Atlas, replace `MONGO_URI` with your Atlas SRV connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart_parking_db?retryWrites=true&w=majority`)*

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Install Dependencies
```bash
# In the server folder
cd server
npm install

# In the client folder
cd ../client
npm install
```

### Step 4: Populate Seed Data
Reset and populate the database with realistic demo slots, users, vehicles, and active bookings:
```bash
cd server
npm run seed
```

### Step 5: Start the Application

**Start the Server:**
```bash
cd server
npm run dev
# Server will listen on http://localhost:5000
```

**Start the Client (in a separate terminal):**
```bash
cd client
npm run dev
# Vite will launch the frontend on http://localhost:5173
```

---

## 🔑 5. Demo Accounts & Credentials

The database seeder provisions realistic accounts with 1-click autofill buttons available directly on the login page:

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Campus Admin** | `admin@smartparking.edu` | `Admin@12345` | Slot CRUD, Live Analytics, Check-in/Check-out, User & Vehicle Management |
| **Student** | `john.doe@smartparking.edu` | `User@12345` | Quick Slot Booking, Vehicle Registration, Pass View, Self-cancellation |
| **Faculty** | `sarah.faculty@smartparking.edu` | `User@12345` | Accessible & 4-Wheeler reservations, pass downloads |
| **Student 2** | `mike.student@smartparking.edu` | `User@12345` | 2-Wheeler parking reservation |

---

## 🧪 6. Automated Testing & Verification

An automated integration test script (`testApi.js`) verifies all 12 core requirements, including server-side conflict rejection:

```bash
cd server
node utils/testApi.js
```

### Test Suite Output:
```text
====================================================
 STARTING SMART PARKING FULL-STACK API TEST SUITE   
====================================================
[1] Health Check: Status 200 => healthy
[2] Admin Login: Status 200 => Campus Admin (Role: admin)
[3] User Login: Status 200 => John Doe (Role: user)
[4] User Registration: Status 201 => Created: Hackathon Tester
[5] Vehicle Registration: Status 201 => Plate: DL-01-HK-XXXX
[6] Get Parking Slots: Status 200 => Found 24 slots across 3 sections
    Selected Slot: A-02 (Ground Floor - Section A)
[7] Check Availability: Status 200 => isAvailable: true
[8] Create Reservation: Status 201 => Ref: PK-YYYYMMDD-XXXX, Status: confirmed, Amount: ₹90
[9] Overlap Conflict Prevention Test: Status 409 (Expected: 409 Conflict)
    ✓ SUCCESS: Server properly rejected conflicting booking with HTTP 409 Conflict
[10] Cancel Reservation: Status 200 => New Status: cancelled
[11] Admin Dashboard: Status 200 => Total Slots: 24, Revenue: ₹391
[12] User Dashboard: Status 200 => Campus Available Slots: 21
====================================================
 ALL 12 API & SECURITY TESTS PASSED PERFECTLY!       
====================================================
```

---

## 📡 7. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new driver account.
- `POST /api/auth/login` - Authenticate credentials and receive signed JWT.
- `GET /api/auth/me` - Fetch currently authenticated user profile.
- `PUT /api/auth/profile` - Update name or phone number.

### Parking Slots (`/api/slots`)
- `GET /api/slots` - Query slots with dynamic `startTime` and `endTime` interval evaluation, filter by `section`, `slotType`, and `status`.
- `GET /api/slots/:id` - Retrieve slot details along with upcoming reservations.
- `POST /api/slots` - *(Admin)* Create a new parking bay.
- `PUT /api/slots/:id` - *(Admin)* Update bay location, type, base price, or toggle maintenance mode.
- `DELETE /api/slots/:id` - *(Admin)* Remove slot (guarded against active bookings).

### Registered Vehicles (`/api/vehicles`)
- `GET /api/vehicles` - List authenticated user's vehicles (Admin retrieves all campus vehicles).
- `GET /api/vehicles/:id` - Get vehicle details with ownership verification.
- `POST /api/vehicles` - Register a vehicle plate number with duplicate plate protection.
- `PUT /api/vehicles/:id` - Update vehicle model or color.
- `DELETE /api/vehicles/:id` - Remove vehicle (guarded against active reservations).

### Reservations (`/api/reservations`)
- `GET /api/reservations/availability` - Real-time query checking if a slot is conflict-free for a time window.
- `POST /api/reservations` - Book a parking slot with atomic overlap checking and price calculation.
- `GET /api/reservations` - List reservations (users see their own; admins see system-wide).
- `GET /api/reservations/:id` - View complete digital pass and booking details.
- `PATCH /api/reservations/:id/cancel` - Cancel a reservation and release the bay immediately.
- `PUT /api/reservations/:id` - *(Admin)* Update status to `active` (Check-in), `completed` (Check-out), or `cancelled`.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/admin` - *(Admin)* Aggregated metrics, section occupancy breakdown, status breakdown, and recent activity.
- `GET /api/dashboard/user` - User's active parking pass, upcoming bookings, vehicle count, and campus live availability.

### User Management (`/api/users`)
- `GET /api/users` - *(Admin)* List all campus users with vehicle and booking counts.
- `GET /api/users/:id` - *(Admin)* Detailed profile of a user with registered vehicles and reservations.
- `PATCH /api/users/:id/role` - *(Admin)* Promote or demote user/admin role.
- `DELETE /api/users/:id` - *(Admin)* Delete user account and cascade delete related vehicle records.

---

## 🎨 8. UI/UX Design System

- **Color Palette:**
  - **Available:** Emerald Green (`#10b981`)
  - **Occupied:** Crimson Red (`#ef4444`)
  - **Reserved:** Amber/Orange (`#f59e0b`)
  - **Maintenance:** Slate Gray (`#94a3b8`)
  - **Primary Accents:** Deep Slate Navy (`#0f172a`), Teal Accent (`#14b8a6`)
- **Responsive Layout:**
  - Full mobile viewport support with slide-out navigation drawer.
  - Interactive parking bay lane markings and vehicle icons.
  - Toast notification system for instant non-blocking feedback.
  - Safe confirmation dialogs before destructive operations.

---
