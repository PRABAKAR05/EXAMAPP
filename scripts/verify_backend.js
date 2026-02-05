const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';

// Test Data
const adminCreds = { username: 'admin', password: 'password123' }; // Try common default
// If that fails, we might need to create one effectively or just ask user. 
// Actually, earlier logs showed login success. I'll assume I can create one if needed or use existing.
// Let's try to creating a temp admin first if login fails, but I can't easily without direct DB.
// I'll try to use a known credential or just create a user via register if open? Admin registration usually closed.
// Let's try to 'seed' the DB first with a script if I can connect to Mongoose.

async function run() {
    console.log('--- Starting Verification ---');
    
    // Connect to DB directly to ensure Admin exists (bypass API auth for setup)
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/exam_app');
        console.log('MongoDB Connected');
        
        const User = require('../server/models/User');
        
        // Ensure Admin Exists
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('Creating Admin...');
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);
            admin = await User.create({
                username: 'admin',
                fullName: 'Admin User',
                password: hashedPassword,
                role: 'admin'
            });
        } else {
            // Reset password to known
            // console.log('Resetting Admin Password...');
            // const bcrypt = require('bcryptjs');
            // const salt = await bcrypt.genSalt(10);
            // admin.password = await bcrypt.hash('123456', salt);
            // await admin.save();
        }
        
        // Ensure Teacher Exists
        let teacher = await User.findOne({ username: 'test_teacher' });
        if (!teacher) {
            teacher = await User.create({
                username: 'test_teacher',
                fullName: 'Test Teacher',
                password: 'password', // will be hashed by hook? No, hook processes 'this.password'
                // Wait, if I use create, hooks run.
                role: 'teacher'
            });
        }

        // Ensure Students Exist
        let student1 = await User.findOne({ username: 'student_1' });
        if (!student1) {
            student1 = await User.create({ username: 'student_1', fullName: 'Student One', password: 'password', role: 'student' });
        }
        let student2 = await User.findOne({ username: 'student_2' });
        if (!student2) {
            student2 = await User.create({ username: 'student_2', fullName: 'Student Two', password: 'password', role: 'student' });
        }
        
        console.log('Test Users Ready');

        // Now test API
        // 1. Login
        console.log('Testing Login...');
        // We know the password for 'admin' might be '123456' from my specialized knowledge of typical setups or I just reset it if I uncommented.
        // Let's try '123456'.
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, { username: 'admin', password: '123456' }); // Assuming 123456
            const token = loginRes.data.token;
            console.log('Login Successful');
            
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // 2. Create Class
            console.log('Creating Class...');
            const classRes = await axios.post(`${API_URL}/admin/classes`, {
                name: 'Integration Test Class',
                subjectCode: 'TEST101',
                batch: '2024'
            }, config);
            const classId = classRes.data._id;
            console.log('Class Created, ID:', classId);

            // 3. Assign Teacher
            console.log('Assigning Teacher...');
            await axios.patch(`${API_URL}/admin/classes/${classId}/assign-teacher`, {
                teacherId: teacher._id
            }, config);
            console.log('Teacher Assigned');

            // 4. Bulk Add Students
            console.log('Bulk Adding Students...');
            const bulkRes = await axios.post(`${API_URL}/admin/classes/${classId}/students/bulk`, {
                studentIds: [student1._id, student2._id]
            }, config);
            console.log('Bulk Add Result:', bulkRes.data);

            if (bulkRes.data.addedCount === 2) {
                console.log('SUCCESS: Students added correctly.');
            } else {
                console.error('FAILURE: Counts mismatch');
            }
            
            // Clean up
            const Class = require('../server/models/Class');
            await Class.findByIdAndDelete(classId);
            console.log('Cleanup: Test Class Deleted');
            
        } catch (apiError) {
            console.error('API Error:', apiError.response ? apiError.response.data : apiError.message);
        }

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Done');
    }
}

run();
