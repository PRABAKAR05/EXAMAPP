const express = require('express');
const router = express.Router();
const { getAllUsers,    createUser, 
    updateUser,
    toggleUserStatus,
    deleteUser,
    getDashboardStats
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Base route: /api/admin

// Protect all routes
router.use(protect);
router.use(admin);

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/stats', getDashboardStats);

module.exports = router;
