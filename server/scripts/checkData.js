require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Class = require('../models/Class');
const User = require('../models/User');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const classCount = await Class.countDocuments();
        const userCount = await User.countDocuments();
        
        console.log(`Classes in DB: ${classCount}`);
        console.log(`Users in DB: ${userCount}`);

        if (classCount > 0) {
            const classes = await Class.find().limit(5);
            console.log('Sample Classes:', JSON.stringify(classes, null, 2));
        }

        process.exit();
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
};

checkData();
