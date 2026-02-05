const express = require('express');
const router = express.Router();
const { 
    createExam, 
    getMyExams, 
    getExamById, 
    addQuestion, 
    togglePublishExam,
    getExamResults,
    getAssignedClasses,
    getClassDetails,
    deleteExam,
    extendExamTime
} = require('../controllers/teacherController');
const { protect, teacher } = require('../middleware/authMiddleware');

// Base route: /api/teacher

// Protect all routes
router.use(protect);
router.use(teacher);

router.post('/exams', createExam);
router.get('/exams', getMyExams);
router.get('/classes', getAssignedClasses); 
router.get('/classes/:id', getClassDetails); // New Route
router.get('/exams/:id', getExamById);
router.get('/exams/:id/results', getExamResults);
router.post('/exams/:id/questions', addQuestion);
router.patch('/exams/:id/publish', togglePublishExam);
router.delete('/exams/:id', deleteExam); 
router.patch('/exams/:id/extend', extendExamTime);

module.exports = router;
