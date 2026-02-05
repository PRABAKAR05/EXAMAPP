const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const Question = require('../models/Question');
const Class = require('../models/Class');

// @desc    Get all available exams for student (Public + Enrolled Private)
// @route   GET /api/student/exams
// @access  Private/Student
const getAvailableExams = async (req, res) => {
    try {
        // 1. Find classes where student is enrolled
        const enrolledClasses = await Class.find({ studentIds: req.user._id }).select('_id');
        const enrolledClassIds = enrolledClasses.map(c => c._id);

        // 2. Query Exams: Active AND (Public OR (Private & Linked to Enrolled Class))
        const exams = await Exam.find({
            isActive: true,
            $or: [
                { accessType: 'public' },
                { accessType: { $exists: false } }, // Handle legacy exams
                { accessType: 'private', classId: { $in: enrolledClassIds } }
            ]
        })
        .populate('classId', 'name') // Optional: Show class name
        .select('-questions')
        .sort({ scheduledStart: -1 })
        .limit(9); // Max 9 allowed
        
        // Fetch sessions for this student
        const sessions = await ExamSession.find({ studentId: req.user._id });
        const sessionMap = new Map();
        sessions.forEach(s => sessionMap.set(s.examId.toString(), s));

        const examsWithStatus = exams.map(exam => {
            const session = sessionMap.get(exam._id.toString());
            return {
                ...exam.toObject(),
                status: session ? session.status : 'not-started',
                score: session ? session.score : null,
                sessionStartTime: session ? session.startTime : null
            };
        });
        
        res.json(examsWithStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Start an exam (Create Session)
// @route   POST /api/student/exams/:id/start
// @access  Private/Student
const startExam = async (req, res) => {
    try {
        const examId = req.params.id;
        const studentId = req.user._id;

        const exam = await Exam.findById(examId).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        if (!exam.isActive) return res.status(400).json({ message: 'Exam is not active' });

        // Check time validation
        const now = new Date();
        if (now < new Date(exam.scheduledStart) || now > new Date(exam.scheduledEnd)) {
            return res.status(400).json({ message: 'Exam is not reachable currently' });
        }

        // Check Access Permission (Private Exams)
        if (exam.accessType === 'private') {
            const classItem = await Class.findById(exam.classId);
            if (!classItem || !classItem.studentIds.includes(studentId)) {
                return res.status(403).json({ message: 'You are not enrolled in the class for this exam' });
            }
        }

        // Check if session already exists
        let session = await ExamSession.findOne({ studentId, examId });
        
        if (session) {
            if (session.status === 'submitted' || session.status === 'terminated') {
                return res.status(400).json({ message: 'You have already attempted this exam' });
            }
            // If in-progress, resume it? 
            // For strictness, let's allow resume but time keeps ticking from original start
            return res.json({ session, exam });
        }

        // Create new session
        session = await ExamSession.create({
            studentId,
            examId,
            startTime: now,
            status: 'in-progress'
        });

        // Return exam WITHOUT correct answers
        // We need to sanitize questions to remove 'isCorrect' field
        const sanitizedQuestions = exam.questions.map(q => ({
            _id: q._id,
            text: q.text,
            options: q.options.map(o => ({ _id: o._id, text: o.text })), // Hide isCorrect
            marks: q.marks
        }));

        res.status(201).json({ 
            session, 
            exam: { ...exam.toObject(), questions: sanitizedQuestions } 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit Exam
// @route   POST /api/student/sessions/:sessionId/submit
// @access  Private/Student
const submitExam = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { answers } = req.body; // Array of { questionId, selectedOptionId }

        const session = await ExamSession.findOne({ _id: sessionId, studentId: req.user._id });

        if (!session) return res.status(404).json({ message: 'Session not found' });
        if (session.status !== 'in-progress') return res.status(400).json({ message: 'Session already submitted' });

        // Calculate Score
        const exam = await Exam.findById(session.examId).populate('questions');
        let totalScore = 0;
        
        // Map questions for quick lookup
        const questionMap = new Map(); // questionId -> Question Doc
        exam.questions.forEach(q => questionMap.set(q._id.toString(), q));

        const processedAnswers = [];

        if (answers && answers.length > 0) {
            answers.forEach(ans => {
                // If the user selected an option
                if (ans.selectedOptionId) {
                    const question = questionMap.get(ans.questionId.toString());
                    if (question) {
                        const selectedOption = question.options.find(opt => opt._id.toString() === ans.selectedOptionId);
                        
                        // Check correctness
                        if (selectedOption && selectedOption.isCorrect) {
                            totalScore += question.marks;
                        }

                        processedAnswers.push({
                            questionId: ans.questionId,
                            selectedOptionId: ans.selectedOptionId
                        });
                    }
                }
            });
        }

        session.answers = processedAnswers;
        session.score = totalScore;
        session.status = 'submitted';
        session.endTime = new Date();
        
        await session.save();

        res.json({ message: 'Exam submitted successfully', score: totalScore, totalMarks: exam.totalMarks });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Log Warning/Violation & Auto-Submit if Limit Exceeded
// @route   POST /api/student/sessions/:sessionId/violation
// @access  Private/Student
const logViolation = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { type, answers } = req.body; // Receive answers

        const session = await ExamSession.findOne({ _id: sessionId, studentId: req.user._id });
        if (!session || session.status !== 'in-progress') {
            return res.status(400).json({ message: 'Invalid session' });
        }

        session.violationCount += 1;
        session.violationLogs.push({ type, timestamp: new Date() });

        // Auto-terminate logic (Rule: 3rd violation = Termination)
        let isTerminated = false;
        let finalScore = 0;
        let message = 'Violation logged';

        // Changed from > 3 to > 2. So 1, 2 are warnings. 3 is termination.
        if (session.violationCount > 2) {
            isTerminated = true;
            session.status = 'terminated';
            session.endTime = new Date();
            message = 'Exam terminated due to violations. Your answers have been auto-submitted and evaluated.';

            // --- AUTO EVALUATION LOGIC ---
            if (answers && answers.length > 0) {
                const exam = await Exam.findById(session.examId).populate('questions');
                
                // Map questions for quick lookup
                const questionMap = new Map();
                exam.questions.forEach(q => questionMap.set(q._id.toString(), q));
                
                const processedAnswers = [];
                
                answers.forEach(ans => {
                    if (ans.selectedOptionId) {
                        const question = questionMap.get(ans.questionId.toString());
                        if (question) {
                            const selectedOption = question.options.find(opt => opt._id.toString() === ans.selectedOptionId);
                            
                            // Check correctness
                            if (selectedOption && selectedOption.isCorrect) {
                                finalScore += question.marks;
                            }

                            processedAnswers.push({
                                questionId: ans.questionId,
                                selectedOptionId: ans.selectedOptionId
                            });
                        }
                    }
                });

                session.answers = processedAnswers;
                session.score = finalScore;
            }
        }

        await session.save();

        res.json({ 
            message, 
            violationCount: session.violationCount,
            isTerminated,
            score: isTerminated ? finalScore : undefined
        });

    } catch (error) {
        console.error("Violation Log Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get result for a specific exam session
// @route   GET /api/student/exams/:id/result
// @access  Private/Student
const getMyExamResult = async (req, res) => {
    try {
        const examId = req.params.id;
        const studentId = req.user._id;

        // Find all sessions for this exam/student
        const sessions = await ExamSession.find({ examId, studentId })
            .populate({
                path: 'examId',
                select: 'title totalMarks passingMarks questions scheduledEnd classId',
                populate: [
                    {
                        path: 'questions',
                        select: 'text options marks'
                    },
                    {
                        path: 'classId',
                        select: 'name'
                    }
                ]
            })
            .sort({ score: -1, startTime: -1 }); // Best score first

        if (!sessions || sessions.length === 0) {
            return res.status(404).json({ message: 'Exam attempt not found' });
        }

        // Check if exam schedule has ended
        const exam = sessions[0].examId;
        const now = new Date();
        const endTime = new Date(exam.scheduledEnd); // Using global scheduled end

        // Optional: allow some buffer or if exam was terminated due to time? 
        // User requested: "result published only after that exam completes"
        if (now < endTime) {
            return res.status(403).json({ 
                message: 'Results are hidden until the exam period is over',
                scheduledEnd: exam.scheduledEnd 
            });
        }

        // Try to find a submitted/terminated session first
        const completedSession = sessions.find(s => s.status === 'submitted' || s.status === 'terminated');
        
        // If we found a completed session, return it
        if (completedSession) {
            return res.json(completedSession);
        }

        // Otherwise, if the only session is in-progress
        if (sessions[0].status === 'in-progress') {
            return res.status(400).json({ message: 'Exam is still in progress' });
        }

        res.json(sessions[0]);
    } catch (error) {
        console.error("Get Result Error", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all enrolled classes for student
// @route   GET /api/student/classes
// @access  Private/Student
const getEnrolledClasses = async (req, res) => {
    try {
        // 1. Find classes where student is enrolled
        const classes = await Class.find({ studentIds: req.user._id })
            .select('name subjectCode batch')
            .sort({ name: 1 });

        // 2. Add upcoming exam count for each class (Optional but helpful for UI)
        // We need to count ALL active exams, not just limit 9
        const classIds = classes.map(c => c._id);
        
        // Aggregate active upcoming exams
        const examCounts = await Exam.aggregate([
            {
                $match: {
                    isActive: true,
                    accessType: 'private',
                    classId: { $in: classIds }
                    // We don't filter scheduledEnd here if we want to show all available, 
                    // or we filter if we only want upcoming.
                    // User wanted "remove past", but then reverted context.
                    // Let's count *Available* exams (future/active) for the badge.
                }
            },
            {
                $group: {
                    _id: "$classId",
                    count: { $sum: 1 }
                }
            }
        ]);

        const countMap = {};
        examCounts.forEach(item => {
            countMap[item._id.toString()] = item.count;
        });

        const classesWithCount = classes.map(c => ({
            ...c.toObject(),
            examCount: countMap[c._id.toString()] || 0
        }));

        res.json(classesWithCount);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAvailableExams,
    getEnrolledClasses,
    startExam,
    submitExam,
    logViolation,
    getMyExamResult
};
