const express = require('express');
const router = express.Router();
const { getAdminDashboard, getUserDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/user', protect, getUserDashboard);
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

module.exports = router;
