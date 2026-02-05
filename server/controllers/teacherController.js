const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Class = require('../models/Class');
const ExamSession = require('../models/ExamSession');
const User = require('../models/User');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs');
const path = require('path');


// @desc    Create a new exam
// @route   POST /api/teacher/exams
// @access  Private/Teacher
const createExam = async (req, res) => {
    try {
        const { title, description, duration, totalMarks, scheduledStart, scheduledEnd, accessType, classId } = req.body;

        const examData = {
            title,
            description,
            duration,
            totalMarks,
            passingMarks: 0, // Default to 0 as it's removed from UI
            scheduledStart,
            scheduledEnd,
            createdBy: req.user._id,
            accessType: accessType || 'public'
        };

        if (accessType === 'private') {
            if (!classId) return res.status(400).json({ message: 'Class is required for private exams' });
            examData.classId = classId;
        }

        const exam = await Exam.create(examData);

        res.status(201).json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all exams created by teacher
// @route   GET /api/teacher/exams
// @access  Private/Teacher
const getMyExams = async (req, res) => {
    try {
        const exams = await Exam.find({ createdBy: req.user._id })
        .sort({ createdAt: -1 })
        .limit(9);
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get classes assigned to teacher
// @route   GET /api/teacher/classes
// @access  Private/Teacher
const getAssignedClasses = async (req, res) => {
    try {
        const classes = await Class.find({ teacherId: req.user._id })
            .select('name subjectCode batch studentIds status isArchived')
            .sort({ createdAt: -1 });
        
        // Transform to send student count directly
        const classList = classes.map(c => ({
            _id: c._id,
            name: c.name,
            subjectCode: c.subjectCode,
            batch: c.batch,
            studentCount: c.studentIds.length,
            status: c.status
        }));

        res.json(classList);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get specific class details for teacher
// @route   GET /api/teacher/classes/:id
// @access  Private/Teacher
const getClassDetails = async (req, res) => {
    try {
        const classItem = await Class.findOne({ 
            _id: req.params.id, 
            teacherId: req.user._id 
        }).populate('studentIds', 'username fullName email'); // Populate student details

        if (!classItem) {
            return res.status(404).json({ message: 'Class not found or not assigned to you' });
        }

        res.json(classItem);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single exam details
// @route   GET /api/teacher/exams/:id
// @access  Private/Teacher
const getExamById = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id })
            .populate('questions');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a question to an exam
// @route   POST /api/teacher/exams/:id/questions
// @access  Private/Teacher
const addQuestion = async (req, res) => {
    try {
        const { text, options, marks } = req.body;
        const examId = req.params.id;

        const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Validate that at least one option is correct
        const hasCorrectOption = options.some(opt => opt.isCorrect);
        if (!hasCorrectOption) {
            return res.status(400).json({ message: 'At least one option must be correct' });
        }

        if (exam.questions.length === 0 && !exam.isActive) {
            // Allow adding questions freely if draft
        } else if (exam.isActive) {
             // 1-Minute Rule Check
            const now = new Date();
            const startTime = new Date(exam.scheduledStart);
            const timeDiff = startTime - now; 
            const ONE_MINUTE = 60 * 1000;

            if (timeDiff < ONE_MINUTE) {
                return res.status(400).json({ message: 'Cannot modify exam less than 1 minute before start time' });
            }
        }

        const question = await Question.create({
            examId,
            text,
            options,
            marks
        });

        // Add question reference to exam
        exam.questions.push(question._id);
        // exam.totalMarks += marks; // Removed: Total Marks is now a fixed target, not a sum
        await exam.save();

        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Publish/Activate an exam
// @route   PATCH /api/teacher/exams/:id/publish
// @access  Private/Teacher
const togglePublishExam = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        if (exam.questions.length === 0) {
            return res.status(400).json({ message: 'Cannot publish exam with 0 questions' });
        }

        // 1-Minute Rule Check
        const now = new Date();
        const startTime = new Date(exam.scheduledStart);
        const timeDiff = startTime - now; 
        const ONE_MINUTE = 60 * 1000;

        // If trying to UNPUBLISH or PUBLISH within 1 minute of start
        if (timeDiff < ONE_MINUTE) {
             return res.status(400).json({ message: 'Cannot change exam status less than 1 minute before start time' });
        }

        // Validate Total Marks
        if (!exam.isActive) { // Only check when attempting to PUBLISH
            // Need to fetch questions to sum marks
            const questions = await Question.find({ _id: { $in: exam.questions } });
            
            const currentTotal = questions.reduce((sum, q) => sum + q.marks, 0);
            
            if (currentTotal !== exam.totalMarks) {
                return res.status(400).json({ 
                    message: `Cannot publish: Total Question Marks (${currentTotal}) do not match Exam Total Marks (${exam.totalMarks})` 
                });
            }
        }

        exam.isActive = !exam.isActive;
        await exam.save();

        let emailCount = 0;
        // Send Notification Email to Students if PUBLISHED
        if (exam.isActive && exam.classId) {
            const classData = await Class.findById(exam.classId).populate('studentIds', 'username fullName email');
            
            if (classData && classData.studentIds.length > 0) {
                 // Format Date
                 const examDate = new Date(exam.scheduledStart).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                const examTime = new Date(exam.scheduledStart).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Send Emails Asynchronously (Fire and Forget) to prevent UI delay
                (async () => {
                    const subject = `Exam Scheduled: ${exam.title}`;
                    const teacherEmail = req.user.email;
                    
                    console.log(`[Exam Publish] Starting background email notifications for ${classData.studentIds.length} students.`);

                    for (const student of classData.studentIds) {
                        try {
                             if (!student.email) continue;
                            
                            const message = `
                                <h1>New Exam Scheduled</h1>
                                <p>Hello ${student.fullName || student.username},</p>
                                <p>A new exam has been scheduled for your class <strong>${classData.name}</strong> by <strong>${req.user.fullName}</strong>.</p>
                                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <h3 style="margin-top:0;">${exam.title}</h3>
                                    <p><strong>👨‍🏫 Teacher:</strong> ${req.user.fullName}</p>
                                    <p><strong>📅 Date:</strong> ${examDate}</p>
                                    <p><strong>⏰ Time:</strong> ${examTime}</p>
                                    <p><strong>⏱️ Duration:</strong> ${exam.duration} Minutes</p>
                                    <p><strong>📝 Questions:</strong> ${exam.questions.length}</p>
                                    <p><strong>🎯 Total Marks:</strong> ${exam.totalMarks}</p>
                                </div>
                                <p>Please login to the portal on time to take the exam.</p>
                            `;

                            await sendEmail({
                                to: student.email,
                                replyTo: teacherEmail,
                                subject: subject,
                                html: message
                            });
                        } catch (err) {
                            console.error(`Failed to email ${student.username}:`, err.message);
                        }
                    }
                })();
                
                // Assume all valid students will be notified
                emailCount = classData.studentIds.length;
            }
        }

        let message = `Exam ${exam.isActive ? 'published' : 'unpublished'}`;
        if (exam.isActive && emailCount > 0) {
            message += `. Notification sent to ${emailCount} students.`;
        }

        res.json({ message, isActive: exam.isActive });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete an exam
// @route   DELETE /api/teacher/exams/:id
// @access  Private/Teacher
const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // 1-Minute Rule Check
        const now = new Date();
        const startTime = new Date(exam.scheduledStart);
        const timeDiff = startTime - now; // Milliseconds until start
        const ONE_MINUTE = 60 * 1000;

        // Restriction applies if exam is active AND we are within 1 minute of start (or started)
        if (exam.isActive && timeDiff < ONE_MINUTE) {
            return res.status(400).json({ message: 'Cannot delete exam less than 1 minute before start time' });
        }

        // Also check if it has already started/ended (optional, but good practice)
        // If it's already started, we definitely shouldn't delete it easily unless empty results?
        // User asked for "before 1min", implying once close to start, it's locked.
        
        await Exam.deleteOne({ _id: req.params.id });
        res.json({ message: 'Exam removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all results for a specific exam
// @route   GET /api/teacher/exams/:id/results
// @access  Private/Teacher
// @desc    Get all results for a specific exam
// @route   GET /api/teacher/exams/:id/results
// @access  Private/Teacher
const getExamResults = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // 1. Get actual attempts (Sessions)
        const sessions = await ExamSession.aggregate([
            { $match: { examId: exam._id } },
            { $sort: { score: -1, startTime: -1 } }, // Prioritize high score
            {
                $group: {
                    _id: "$studentId",
                    doc: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } }
        ]);

        // Map attempts for easy lookup
        const attemptsMap = {};
        sessions.forEach(session => {
            attemptsMap[session.studentId.toString()] = session;
        });

        let finalResults = [];

        // 2. If it's a Private Exam (Class-based), get ALL students
        if (exam.classId) {
            const classData = await Class.findById(exam.classId).populate('studentIds', 'username fullName email batch');
            
            if (classData) {
                finalResults = classData.studentIds.map(student => {
                    const studentId = student._id.toString();
                    if (attemptsMap[studentId]) {
                        // Student took the exam - return the populated session
                        return {
                            ...attemptsMap[studentId],
                            studentId: student // Replace ID with full student object
                        };
                    } else {
                        // Student did NOT take the exam - return placeholder
                        return {
                            _id: `missing_${studentId}`, // Temp ID
                            studentId: student,
                            score: '-',
                            status: 'Not Attended',
                            violationCount: 0,
                            startTime: null
                        };
                    }
                });
            } else {
                // Fallback if class not found (shouldn't happen)
                 await ExamSession.populate(sessions, { path: 'studentId', select: 'username fullName batch' });
                 finalResults = sessions;
            }

        } else {
            // Public Exam - just return whoever took it
            await ExamSession.populate(sessions, { path: 'studentId', select: 'username fullName batch' });
            finalResults = sessions;
        }

        // 3. Sort: Submitted/Terminated/In-progress first (by Score), then Not Attended (Alphabetical name)
        finalResults.sort((a, b) => {
            const hasAttendedA = a.status !== 'Not Attended';
            const hasAttendedB = b.status !== 'Not Attended';

            if (hasAttendedA && !hasAttendedB) return -1;
            if (!hasAttendedA && hasAttendedB) return 1;

            if (hasAttendedA && hasAttendedB) {
                // Both attended: Sort by Score Desc
                return b.score - a.score;
            } else {
                // Both absent: Sort by Name Asc
                return a.studentId.fullName.localeCompare(b.studentId.fullName);
            }
        });

        res.json(finalResults);
    } catch (error) {
        console.error("Results Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Extend exam duration
// @route   PATCH /api/teacher/exams/:id/extend
// @access  Private/Teacher
const extendExamTime = async (req, res) => {
    try {
        const { extraMinutes } = req.body;
        const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        if (extraMinutes <= 0) {
            return res.status(400).json({ message: 'Extra minutes must be positive' });
        }

        // Logic: Add minutes to duration and scheduledEnd
        exam.duration += extraMinutes;
        
        const oldEnd = new Date(exam.scheduledEnd);
        const newEnd = new Date(oldEnd.getTime() + extraMinutes * 60000);
        exam.scheduledEnd = newEnd;

        await exam.save();

        res.json({ 
            message: `Exam time extended by ${extraMinutes} minutes`, 
            duration: exam.duration, 
            scheduledEnd: exam.scheduledEnd 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};






module.exports = {
    createExam,
    getMyExams,
    getExamById,
    addQuestion,
    togglePublishExam,
    getExamResults,
    getAssignedClasses,
    getClassDetails,
    deleteExam,
    extendExamTime,

};
