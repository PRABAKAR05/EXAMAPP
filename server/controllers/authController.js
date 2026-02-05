const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '1h'
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log(`Login attempt for: ${username}`);
        const user = await User.findOne({ username });

        if (!user) {
            console.log('User NOT found');
            const mongoose = require('mongoose');
            return res.status(401).json({ 
                message: `Invalid username or password (User not found in DB: ${mongoose.connection.name})`,
                db: mongoose.connection.name 
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(401).json({ message: 'Invalid username or password (Wrong password)' });
        }

        if (user.isDisabled) {
            return res.status(403).json({ message: 'Account is disabled. Contact Admin.' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            isFirstLogin: user.isFirstLogin,
            token: generateToken(user._id, user.role)
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Change password (Mainly for first login)
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid old password' });
        }

        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const seedAdminForce = async (req, res) => {
    try {
        console.log('Force Seeding Admin...');
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            existingAdmin.password = 'admin123';
            await existingAdmin.save();
            return res.json({ message: 'Admin exists. Password reset to: admin123', user: existingAdmin });
        }

        const newAdmin = await User.create({
            username: 'admin',
            email: 'admin@debug.com',
            password: 'admin123',
            role: 'admin',
            fullName: 'Emergency Admin',
            isFirstLogin: false
        });

        res.json({ message: 'Admin created successfully', user: newAdmin });
    } catch (error) {
        console.error('Seed Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser, changePassword, seedAdminForce };
