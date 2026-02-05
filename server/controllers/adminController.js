const User = require('../models/User');
const Exam = require('../models/Exam');
const Class = require('../models/Class');

const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all users (with optional role filter)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    const { role } = req.query;
    try {
        let query = {};
        if (role) {
            query.role = role;
        }
        // Exclude password
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new user (Teacher or Student)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
    const { username, email, password, role, fullName, batch } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Can only create teacher or student' });
    }

    try {
        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: `Username '${username}' is already taken` });
        }

        // Create user
        // Password hashing is handled in User model pre-save
        const user = await User.create({
            username,
            email,
            password,
            role,
            fullName,
            batch, // Optional, mainly for students
            isFirstLogin: true // Force password change
        });

        if (user) {
            // Send Welcome Email Asynchronously (Fire and Forget)
            (async () => {
                try {
                    const message = `
                        <h1>Welcome to the Exam Portal</h1>
                        <p>Your account has been created successfully.</p>
                        <p><strong>Role:</strong> ${user.role}</p>
                        <p><strong>Username:</strong> ${user.username}</p>
                        <p><strong>Temporary Password:</strong> ${password}</p>
                        <p>Please login and change your password immediately.</p>
                    `;

                    await sendEmail({
                        to: user.email,
                        subject: 'Exam Portal - Your Account Credentials',
                        html: message
                    });
                    console.log(`[Email Sent] Welcome email sent to ${user.username}`);
                } catch (emailError) {
                    console.error('Email send failed:', emailError.message);
                }
            })();

            res.status(201).json({
                _id: user._id,
                username: user.username,
                role: user.role,
                message: 'User created successfully! Credentials will be emailed shortly.'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `Duplicate value entered for ${field}. If this is 'email', the database still has a unique constraint.` });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { email, fullName, role, batch } = req.body;

        if (email) user.email = email;
        user.fullName = fullName || user.fullName;
        user.role = role || user.role;
        user.batch = batch || user.batch;

        // Username and Password are NOT updated here

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            fullName: updatedUser.fullName,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle user status (Disable/Enable)
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot disable admin accounts' });
        }

        user.isDisabled = !user.isDisabled;
        await user.save();

        res.json({ 
            message: `User ${user.isDisabled ? 'disabled' : 'enabled'} successfully`,
            isDisabled: user.isDisabled
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin accounts' });
        }

        // Safety Check for Teachers
        if (user.role === 'teacher') {
            const assignedClass = await Class.findOne({ teacherId: user._id });
            if (assignedClass) {
                return res.status(400).json({ 
                    message: `Cannot delete teacher. They are assigned to class '${assignedClass.name}'. Please reassign first.` 
                });
            }
        }

        // Cleanup for Students
        let removedFromClassesCount = 0;
        if (user.role === 'student') {
            const result = await Class.updateMany(
                { studentIds: user._id },
                { $pull: { studentIds: user._id } }
            );
            removedFromClassesCount = result.modifiedCount;
        }

        // Send Deletion Email Asynchronously
        (async () => {
            try {
                const message = `
                    <h1>Account Deleted</h1>
                    <p>Hello ${user.fullName || user.username},</p>
                    <p>Your account has been permanently deleted from the <strong>Exam Portal</strong> by the administrator.</p>
                    <p>If you believe this is an error, please contact support.</p>
                `;

                await sendEmail({
                    to: user.email,
                    subject: 'Your account has been deleted from Exam Portal',
                    html: message
                });
                console.log(`[Email Sent] Deletion notification sent to ${user.username}`);
            } catch (emailError) {
                console.error('Failed to send deletion email:', emailError.message);
            }
        })();

        await user.deleteOne();

        let successMessage = `User deleted successfully.`;
        if (removedFromClassesCount > 0) successMessage += ` Removed from ${removedFromClassesCount} classes.`;

        res.json({ message: successMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const examCount = await Exam.countDocuments({ status: 'published' }); // Count active/published exams
        const classCount = await Class.countDocuments({ status: 'active' }); // Count active classes
        
        res.json({
            users: userCount,
            exams: examCount,
            classes: classCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    getDashboardStats
};
