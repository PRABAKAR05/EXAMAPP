const mongoose = require('mongoose');
const User = require('./models/User'); 
const bcrypt = require('bcryptjs');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/exam_app');
        console.log('MongoDB Connected');
        
        const username = 'test_teacher';
        const newPassword = 'password';
        
        let teacher = await User.findOne({ username });
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(newPassword, salt);
        // Mongoose pre-save hook will hash it!

        if (teacher) {
            teacher.password = newPassword;
            await teacher.save();
            console.log(`Updated password for ${username}`);
        } else {
            teacher = await User.create({
                username,
                fullName: 'Test Teacher Refreshed',
                email: 'test_teacher_refreshed@test.com',
                password: newPassword, // Hook will hash
                role: 'teacher'
            });
            console.log(`Created new user ${username}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
