const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Class = require('../models/Class');
const User = require('../models/User');

const debugClassEmails = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find a class with students
        const classes = await Class.find().populate('studentIds', 'username fullName email');
        
        console.log(`Found ${classes.length} classes.`);

        for (const cls of classes) {
            console.log(`\nClass: ${cls.name} (${cls.subjectCode})`);
            console.log(`Student Count: ${cls.studentIds.length}`);
            if (cls.studentIds.length > 0) {
                cls.studentIds.forEach(s => {
                    console.log(` - Student: ${s.username} | Email: "${s.email}" | Valid: ${!!s.email}`);
                });
            } else {
                console.log(' - No students enrolled.');
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
    }
};

debugClassEmails();
