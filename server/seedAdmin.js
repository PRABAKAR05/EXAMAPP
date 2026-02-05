const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit();
        }

        await User.create({
            username: 'admin',
            email: 'admin@example.com', // Added required email
            password: 'adminpassword123', // Will be hashed by pre-save hook
            role: 'admin',
            fullName: 'System Administrator',
            isFirstLogin: false // Skip password change for initial admin
        });

        console.log('Default Admin created:');
        console.log('Username: admin');
        console.log('Password: adminpassword123');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
