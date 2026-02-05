const mongoose = require('mongoose');
const User = require('./models/User'); 
const Class = require('./models/Class'); 
const bcrypt = require('bcryptjs');

const API_URL = 'http://localhost:5000/api';

async function run() {
    console.log('--- Starting Verification (Fetch Version) ---');
    
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/exam_app');
        console.log('MongoDB Connected');
        
        // Ensure Admin Exists
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('Creating Admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);
            admin = await User.create({
                username: 'admin',
                fullName: 'Admin User',
                password: hashedPassword,
                role: 'admin'
            });
        }
        
        // Ensure Teacher & Students
        let teacher = await User.findOne({ username: 'test_teacher' });
        if (!teacher) {
            const salt = await bcrypt.genSalt(10);
            teacher = await User.create({ username: 'test_teacher', fullName: 'Test Teacher', password: await bcrypt.hash('password', salt), role: 'teacher' });
        }
        
        let student1 = await User.findOne({ username: 'student_1' });
        if (!student1) {
            const salt = await bcrypt.genSalt(10);
            student1 = await User.create({ username: 'student_1', fullName: 'S1', password: await bcrypt.hash('password', salt), role: 'student' });
        }

        let student2 = await User.findOne({ username: 'student_2' });
        if (!student2) {
            const salt = await bcrypt.genSalt(10);
            student2 = await User.create({ username: 'student_2', fullName: 'S2', password: await bcrypt.hash('password', salt), role: 'student' });
        }

        console.log('Test Users Ready');

        // Helper for fetch
        const post = async (endpoint, body, token = null) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`API Error ${res.status}: ${text}`);
            }
            return res.json();
        };

        const patch = async (endpoint, body, token) => {
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(`API Error ${res.status}`);
            return res.json();
        };

        // Test API
        console.log('Logging in...');
        let token;
        try {
            const data = await post('/auth/login', { username: 'admin', password: '123456' });
            token = data.token;
        } catch (e) {
            console.log('Login failed with 123456, trying "admin"...');
            const data = await post('/auth/login', { username: 'admin', password: 'admin' });
            token = data.token;
        }
        console.log('Login Successful');
        
        // Create Class
        console.log('Creating Class...');
        const classData = await post('/admin/classes', {
            name: 'Backend Verify Class Fetch',
            subjectCode: 'FETCH101',
            batch: '2024'
        }, token);
        const classId = classData._id;
        console.log('Class Created:', classId);

        // Bulk Add
        console.log('Testing Bulk Add...');
        const bulkRes = await post(`/admin/classes/${classId}/students/bulk`, {
            studentIds: [student1._id, student2._id]
        }, token);
        
        console.log('Bulk Add Response:', bulkRes);
        
        if (bulkRes.addedCount === 2) {
            console.log('✅ VERIFICATION PASSED: Bulk Add works.');
        } else {
            console.error('❌ VERIFICATION FAILED: Count mismatch.');
        }

        // Cleanup
        await Class.findByIdAndDelete(classId);
        console.log('Cleanup Done');

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
