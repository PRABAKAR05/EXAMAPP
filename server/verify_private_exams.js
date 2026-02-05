const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');
const Exam = require('./models/Exam');
const bcrypt = require('bcryptjs');

// Helper to mock request/response for controller testing if needed, 
// but here we will test logic directly via Models which is faster/cleaner for logic verification.
// Actually, to test the *Controller* logic (filtering), we should ideally hit the API or call the controller function.
// Calling controller function needs req/res mocks. 
// Let's hitting the DB directly to simulate "What the controller query does".
// The controller query is:
// const enrolledClasses = await Class.find({ studentIds: req.user._id }).select('_id');
// const exams = await Exam.find({ isActive: true, $or: [{ accessType: 'public' }, { accessType: 'private', classId: { $in: enrolledClassIds } }] })

async function run() {
    console.log('--- Verifying Private Exams Logic ---');
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/exam_app');
        
        // 1. Setup Data
        console.log('Setting up test data...');
        
        // Create Teacher
        const teacher = await User.findOneAndUpdate(
            { username: 'verify_teacher' },
            { 
                username: 'verify_teacher', 
                role: 'teacher', 
                password: 'hash', 
                fullName: 'Verify Teacher' 
            },
            { upsert: true, new: true }
        );

        // Create Students
        const sEnrolled = await User.findOneAndUpdate(
            { username: 'enrolled_student' }, 
            { username: 'enrolled_student', role: 'student', password: 'hash', fullName: 'Enrolled Student' },
            { upsert: true, new: true }
        );
        const sOutsider = await User.findOneAndUpdate(
            { username: 'outsider_student' }, 
            { username: 'outsider_student', role: 'student', password: 'hash', fullName: 'Outsider Student' },
            { upsert: true, new: true }
        );

        // Create Class
        const cls = await Class.create({
            name: 'Private Class',
            subjectCode: 'PRIV101',
            batch: '2024',
            teacherId: teacher._id,
            studentIds: [sEnrolled._id], // Only one student enrolled
            status: 'active'
        });

        // Create Public Exam
        const pubExam = await Exam.create({
            title: 'Public Exam',
            passingMarks: 10,
            duration: 30,
            scheduledStart: new Date(),
            scheduledEnd: new Date(Date.now() + 100000),
            createdBy: teacher._id,
            isActive: true,
            accessType: 'public'
        });

        // Create Private Exam
        const privExam = await Exam.create({
            title: 'Private Exam',
            passingMarks: 10,
            duration: 30,
            scheduledStart: new Date(),
            scheduledEnd: new Date(Date.now() + 100000),
            createdBy: teacher._id,
            isActive: true,
            accessType: 'private',
            classId: cls._id
        });

        console.log('Data Setup Complete.');

        // 2. Verify Logic for Enrolled Student
        console.log('\n--- Checking Enrolled Student ---');
        const enrolledClassIds = (await Class.find({ studentIds: sEnrolled._id })).map(c => c._id);
        const visibleToEnrolled = await Exam.find({
            isActive: true,
            $or: [
                { accessType: 'public' },
                { accessType: 'private', classId: { $in: enrolledClassIds } }
            ]
        });
        
        const hasPublic = visibleToEnrolled.find(e => e.title === 'Public Exam');
        const hasPrivate = visibleToEnrolled.find(e => e.title === 'Private Exam');

        if (hasPublic && hasPrivate) {
            console.log('✅ PASS: Enrolled student sees BOTH Public and Private exams.');
        } else {
            console.error('❌ FAIL: Enrolled student missing exams.', { public: !!hasPublic, private: !!hasPrivate });
        }


        // 3. Verify Logic for Outsider Student
        console.log('\n--- Checking Outsider Student ---');
        const outsiderClassIds = (await Class.find({ studentIds: sOutsider._id })).map(c => c._id);
        const visibleToOutsider = await Exam.find({
            isActive: true,
            $or: [
                { accessType: 'public' },
                { accessType: 'private', classId: { $in: outsiderClassIds } }
            ]
        });

        const outHasPublic = visibleToOutsider.find(e => e.title === 'Public Exam');
        const outHasPrivate = visibleToOutsider.find(e => e.title === 'Private Exam');

        if (outHasPublic && !outHasPrivate) {
            console.log('✅ PASS: Outsider student sees ONLY Public exam.');
        } else {
            console.error('❌ FAIL: Visibility leak.', { public: !!outHasPublic, privateVisible: !!outHasPrivate });
        }

        // Cleanup
        await Class.findByIdAndDelete(cls._id);
        await Exam.findByIdAndDelete(pubExam._id);
        await Exam.findByIdAndDelete(privExam._id);
        console.log('\nCleanup Done.');

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
