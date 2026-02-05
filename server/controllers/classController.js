    const Class = require('../models/Class');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Create a new class
// @route   POST /api/admin/classes
// @access  Private/Admin
const createClass = async (req, res) => {
    try {
        const { name, subjectCode, batch } = req.body;

        const newClass = await Class.create({
            name,
            subjectCode,
            batch,
            status: 'draft'
        });

        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all classes with usage stats
// @route   GET /api/admin/classes
// @access  Private/Admin
const getAllClasses = async (req, res) => {
    try {
        console.log('API Request: getAllClasses - Fetching from DB...');
        const classes = await Class.find()
            .populate('teacherId', 'username fullName')
            .sort({ createdAt: -1 });
            
        console.log(`API Success: Found ${classes.length} classes`);
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single class details
// @route   GET /api/admin/classes/:id
// @access  Private/Admin
const getClassById = async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id)
            .populate('teacherId', 'username fullName email')
            .populate('studentIds', 'username fullName email batch');

        if (!classItem) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.json(classItem);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign Teacher to Class
// @route   PATCH /api/admin/classes/:id/assign-teacher
// @access  Private/Admin
const assignTeacher = async (req, res) => {
    try {
        const { teacherId } = req.body;
        const classItem = await Class.findById(req.params.id);

        if (!classItem) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (classItem.status === 'archived') {
            return res.status(400).json({ message: 'Cannot edit archived class' });
        }

        // Verify user is a teacher
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(400).json({ message: 'Invalid teacher selected' });
        }

        const oldTeacherId = classItem.teacherId;

        classItem.teacherId = teacherId;
        await classItem.save();

        // Send Emails Asynchronously (Fire and Forget)
        (async () => {
            // 1. Notify NEW Teacher
            try {
                const message = `
                    <h1>Class Assignment Notification</h1>
                    <p>Hello ${teacher.fullName || teacher.username},</p>
                    <p>You have been assigned to a new class.</p>
                    <p><strong>Class Name:</strong> ${classItem.name}</p>
                    <p><strong>Subject Code:</strong> ${classItem.subjectCode}</p>
                    <p><strong>Batch:</strong> ${classItem.batch}</p>
                    <p>Please login to your dashboard to view details.</p>
                `;

                await sendEmail({
                    to: teacher.email,
                    subject: `New Class Assignment: ${classItem.name}`,
                    html: message
                });
                
                console.log(`[Email Sent] Assigned teacher ${teacher.username}`);
            } catch (emailError) {
                console.error('Failed to send teacher assignment email:', emailError.message);
            }

            // 2. Notify OLD Teacher (if exists)
            if (oldTeacherId && oldTeacherId.toString() !== teacherId) {
                try {
                    const oldTeacher = await User.findById(oldTeacherId);
                    if (oldTeacher) {
                        const message = `
                            <h1>Class Removal Notification</h1>
                            <p>Hello ${oldTeacher.fullName || oldTeacher.username},</p>
                            <p>You have been removed from the class <strong>${classItem.name}</strong>.</p>
                            <p>This class has been reassigned to another teacher.</p>
                        `;

                        await sendEmail({
                            to: oldTeacher.email,
                            subject: `You have been removed from: ${classItem.name}`,
                            html: message
                        });
                        console.log(`[Email Sent] Removes old teacher ${oldTeacher.username}`);
                    }
                } catch (emailError) {
                    console.error('Failed to send old teacher removal email:', emailError.message);
                }
            }
        })();

        res.json({ 
            message: 'Teacher assigned successfully. Notifications sent in background.',
            class: classItem 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add Student to Class
// @route   POST /api/admin/classes/:id/students
// @access  Private/Admin
const addStudentToClass = async (req, res) => {
    try {
        const { studentId } = req.body;
        const classItem = await Class.findById(req.params.id).populate('teacherId', 'username fullName');

        if (!classItem) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (classItem.status === 'archived') {
            return res.status(400).json({ message: 'Cannot edit archived class' });
        }

        if (classItem.studentIds.length >= 50) {
            return res.status(400).json({ message: 'Class is full (Max 50)' });
        }

        if (classItem.studentIds.includes(studentId)) {
            return res.status(400).json({ message: 'Student already in class' });
        }

        // Verify user is a student
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(400).json({ message: 'Invalid student selected' });
        }

        // Check if student is already enrolled in another class with the SAME SUBJECT NAME
        const existingClass = await Class.findOne({
            _id: { $ne: classItem._id }, // Not this class
            name: classItem.name, // Same subject name
            studentIds: studentId // Student is present
        });

        if (existingClass) {
            return res.status(400).json({ 
                message: `Student is already enrolled in another '${classItem.name}' class (Batch: ${existingClass.batch || 'None'}).` 
            });
        }

        classItem.studentIds.push(studentId);
        await classItem.save();

        // Send Email to Student
        try {
            const teacherName = classItem.teacherId ? (classItem.teacherId.fullName || classItem.teacherId.username) : 'Unassigned';
            const message = `
                <h1>Class Enrollment Notification</h1>
                <p>Hello ${student.fullName || student.username},</p>
                <p>You have been enrolled in the class <strong>${classItem.name}</strong>.</p>
                <p><strong>Subject Code:</strong> ${classItem.subjectCode}</p>
                <p><strong>Batch:</strong> ${classItem.batch}</p>
                <p><strong>Teacher:</strong> ${teacherName}</p>
                <p>Please login to your dashboard to view course materials.</p>
            `;

            await sendEmail({
                to: student.email,
                subject: `Enrolled in Class: ${classItem.name}`,
                html: message
            });
        } catch (emailError) {
            console.error('Failed to send student enrollment email:', emailError);
        }

        res.json({ message: 'Student added successfully', studentCount: classItem.studentIds.length });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Bulk Add Students to Class
// @route   POST /api/admin/classes/:id/students/bulk
// @access  Private/Admin
const bulkAddStudents = async (req, res) => {
    try {
        const { studentIds } = req.body; // Array of IDs
        const classItem = await Class.findById(req.params.id).populate('teacherId', 'username fullName');

        if (!classItem) return res.status(404).json({ message: 'Class not found' });
        if (classItem.status === 'archived') return res.status(400).json({ message: 'Cannot edit archived class' });

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'No students selected' });
        }

        // Calculate space remaining
        const currentCount = classItem.studentIds.length;
        const newCount = studentIds.length;
        if (currentCount + newCount > 50) {
            return res.status(400).json({ 
                message: `Capacity exceeded. You can only add ${50 - currentCount} more students.` 
            });
        }

        // Filter out duplicates (already in class)
        const uniqueIds = studentIds.filter(id => !classItem.studentIds.includes(id));

        if (uniqueIds.length === 0) {
            return res.json({ message: 'All selected students are already enrolled.' });
        }

        // Verify valid students
        const validStudents = await User.find({ 
            _id: { $in: uniqueIds },
            role: 'student'
        });

        if (validStudents.length !== uniqueIds.length) {
            return res.status(400).json({ message: 'One or more invalid student IDs provided' });
        }

        // Check for subject-level duplicates for ALL new students
        // We find any class with same name, excluding this one, that contains ANY of the new student IDs
        const existingClasses = await Class.find({
            _id: { $ne: classItem._id },
            name: classItem.name,
            studentIds: { $in: uniqueIds }
        }).populate('studentIds', 'username');

        if (existingClasses.length > 0) {
            // Find which student caused the issue for better error message
            // Just picking the first one found for brevity
            const conflictClass = existingClasses[0];
            const conflictStudentId = uniqueIds.find(uid => conflictClass.studentIds.some(s => s._id.toString() === uid));
            // We need to fetch the student name for the error message since uniqueIds is just IDs
            const conflictStudent = validStudents.find(s => s._id.toString() === conflictStudentId);
            
            return res.status(400).json({ 
                message: `Cannot bulk add. Student '${conflictStudent.username}' is already enrolled in another '${classItem.name}' class.` 
            });
        }

        // Push to array
        classItem.studentIds.push(...uniqueIds);
        await classItem.save();

        // Send Emails to ALL new students
        // We do this asynchronously so we don't block the response too long
        // But for bulk, it might take a moment.
        (async () => {
             const teacherName = classItem.teacherId ? (classItem.teacherId.fullName || classItem.teacherId.username) : 'Unassigned';
             for (const student of validStudents) {
                 // Only send to the ones we just added
                 if (uniqueIds.includes(student._id.toString())) {
                     try {
                        const message = `
                            <h1>Class Enrollment Notification</h1>
                            <p>Hello ${student.fullName || student.username},</p>
                            <p>You have been enrolled in the class <strong>${classItem.name}</strong>.</p>
                            <p><strong>Subject Code:</strong> ${classItem.subjectCode}</p>
                            <p><strong>Batch:</strong> ${classItem.batch}</p>
                            <p><strong>Teacher:</strong> ${teacherName}</p>
                            <p>Please login to your dashboard to view course materials.</p>
                        `;

                        await sendEmail({
                            to: student.email,
                            subject: `Enrolled in Class: ${classItem.name}`,
                            html: message
                        });
                     } catch (err) {
                         console.error(`Failed to email student ${student.username}:`, err);
                     }
                 }
             }
        })();

        res.json({ 
            message: `Successfully added ${uniqueIds.length} students. Emails are being sent.`, 
            addedCount: uniqueIds.length,
            totalStudents: classItem.studentIds.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove Student from Class
// @route   DELETE /api/admin/classes/:id/students/:studentId
// @access  Private/Admin
const removeStudentFromClass = async (req, res) => {
    try {
        const { id, studentId } = req.params;
        const classItem = await Class.findById(id);

        if (!classItem) return res.status(404).json({ message: 'Class not found' });
        if (classItem.status === 'archived') return res.status(400).json({ message: 'Cannot edit archived class' });

        classItem.studentIds = classItem.studentIds.filter(sid => sid.toString() !== studentId);
        await classItem.save();

        res.json({ message: 'Student removed', studentCount: classItem.studentIds.length });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Class Status (Activate/Archive)
// @route   PATCH /api/admin/classes/:id/status
// @access  Private/Admin
const updateClassStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['draft', 'active', 'archived'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const classItem = await Class.findById(req.params.id);
        if (!classItem) return res.status(404).json({ message: 'Class not found' });

        classItem.status = status;
        await classItem.save();

        res.json({ message: `Class status updated to ${status}`, status: classItem.status });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a class
// @route   DELETE /api/admin/classes/:id
// @access  Private/Admin
const deleteClass = async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id);

        if (!classItem) {
            return res.status(404).json({ message: 'Class not found' });
        }

        await classItem.deleteOne();
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createClass,
    getAllClasses,
    getClassById,
    assignTeacher,
    addStudentToClass,
    bulkAddStudents,
    removeStudentFromClass,
    updateClassStatus,
    deleteClass
};
