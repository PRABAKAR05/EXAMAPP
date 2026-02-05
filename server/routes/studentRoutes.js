const express = require('express');
const router = express.Router();
const { 
    getAvailableExams, 
    getEnrolledClasses,
    startExam, 
    submitExam, 
    logViolation,
    getMyExamResult
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

// Base route: /api/student

router.use(protect);

router.get('/exams', getAvailableExams);
router.get('/classes', getEnrolledClasses);
router.get('/exams/:id/result', getMyExamResult);
router.post('/exams/:id/start', startExam);
router.post('/sessions/:sessionId/submit', submitExam);
router.post('/sessions/:sessionId/violation', logViolation);

module.exports = router;
