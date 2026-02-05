const mongoose = require('mongoose');
const User = require('./models/User');

// Explicitly use the Cloud URI (hardcoded temporarily for this script only)
const MONGO_URI = 'mongodb+srv://todoUser:Praba%400503@cluster0.guaqk7b.mongodb.net/exam_app?retryWrites=true&w=majority';

const resetAdmin = async () => {
    try {
        console.log('Connecting to Cloud Database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        // Find admin
        let admin = await User.findOne({ username: 'admin' });
        
        if (admin) {
            console.log('Found admin user. Updating password...');
            // Explicitly set password to trigger pre-save hook
            admin.password = 'admin123'; 
            await admin.save();
            console.log('✅ Admin password reset to: admin123');
        } else {
            console.log('Admin user not found. Creating new admin...');
            await User.create({
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin',
                fullName: 'System Administrator',
                isFirstLogin: false
            });
            console.log('✅ New Admin created with password: admin123');
        }
        
        process.exit();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

resetAdmin();
