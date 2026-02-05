const mongoose = require('mongoose');
const User = require('./models/User');

// Use environment variable ONLY
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

const checkDb = async () => {
    try {
        console.log('--- DB DIAGNOSTIC START ---');
        console.log(`Connecting to URI length: ${uri ? uri.length : 'UNDEFINED'}`);
        
        // Connect
        const conn = await mongoose.connect(uri);
        console.log(`Connected to Host: ${conn.connection.host}`);
        console.log(`Connected to Database Name: ${conn.connection.name}`); // CRITICAL: Check DB Name
        
        // Count users
        const count = await User.countDocuments();
        console.log(`Total Users in DB: ${count}`);
        
        // Check for admin
        const admin = await User.findOne({ username: 'admin' });
        if (admin) {
            console.log('✅ Admin user FOUND');
            console.log(`Admin ID: ${admin._id}`);
            console.log(`Admin Email: ${admin.email}`);
            console.log(`Admin Role: ${admin.role}`);
        } else {
            console.log('❌ Admin user NOT FOUND');
            
            // List all users to see what exists
            const allUsers = await User.find({}, 'username email role');
            console.log('Existing users:', JSON.stringify(allUsers, null, 2));

            // Force create if missing (Emergency Recovery)
            console.log('Attempting Emergency Creation...');
            await User.create({
                username: 'admin',
                email: 'admin@debug.com',
                password: 'admin123',
                role: 'admin',
                fullName: 'Emergency Admin',
                isFirstLogin: false
            });
            console.log('✅ Emergency Admin Created');
        }
        
    } catch (error) {
        console.error('DIAGNOSTIC FACTAL ERROR:', error);
    } finally {
        console.log('--- DB DIAGNOSTIC END ---');
        // Do not exit, let logs flush
        setTimeout(() => process.exit(0), 2000);
    }
};

checkDb();
