require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('users');
        
        try {
            await collection.dropIndex('email_1');
            console.log('Successfully dropped email_1 index');
        } catch (error) {
            console.log('Error dropping index (might not exist):', error.message);
        }

        // Also check for other potential email indexes just in case
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        process.exit();
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
};

dropIndex();
