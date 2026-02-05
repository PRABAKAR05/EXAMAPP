require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Class = require('../models/Class');
const User = require('../models/User');

const testControllerLogic = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('Testing Class.find().populate()...');
        
        try {
            const classes = await Class.find()
                .populate('teacherId', 'username fullName')
                .sort({ createdAt: -1 });
            
            console.log(`Successfully fetched ${classes.length} classes.`);
            if (classes.length > 0) {
                console.log('First Class Teacher:', JSON.stringify(classes[0].teacherId, null, 2));
            }
        } catch (error) {
            console.error('Logic Failed:', error);
        }

        process.exit();
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
};

testControllerLogic();
