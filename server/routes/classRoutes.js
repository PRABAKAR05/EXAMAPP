const express = require('express');
const router = express.Router();
const { 
    createClass, 
    getAllClasses, 
    getClassById, 
    assignTeacher, 
    addStudentToClass, 
    bulkAddStudents,
    removeStudentFromClass,
    updateClassStatus,
    deleteClass
} = require('../controllers/classController');
const { protect, admin } = require('../middleware/authMiddleware');

// Base route: /api/admin/classes
router.use(protect);
router.use(admin);

router.post('/', createClass);
router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.patch('/:id/assign-teacher', assignTeacher);
router.post('/:id/students', addStudentToClass);
router.post('/:id/students/bulk', bulkAddStudents); // New Bulk Route
router.delete('/:id/students/:studentId', removeStudentFromClass);
router.patch('/:id/status', updateClassStatus);
router.delete('/:id', deleteClass);

module.exports = router;
