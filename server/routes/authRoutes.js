const express = require('express');
const router = express.Router();
const { loginUser, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/seed-admin-force', require('../controllers/authController').seedAdminForce); // Temporary Debug Route
router.post('/change-password', protect, changePassword);

module.exports = router;
