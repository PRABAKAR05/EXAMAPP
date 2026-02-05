const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    status: {
        type: String,
        enum: ['in-progress', 'submitted', 'terminated'],
        default: 'in-progress'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOptionId: { type: mongoose.Schema.Types.ObjectId } 
        // We can just store text or index, but storing option _id is safer if we had them. 
        // Our Question model options don't have explicit _ids unless Mongoose adds them by default (it does for subdocs array objects).
        // Let's assume subdoc _id.
    }],
    score: {
        type: Number,
        default: 0
    },
    violationCount: {
        type: Number,
        default: 0
    },
    violationLogs: [{
        type: { type: String, enum: ['tab_switch', 'focus_loss', 'fullscreen_exit', 'other'] },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Ensure a student can only have one active session per exam? 
// Or distinct? Let's handle logic in controller.
examSessionSchema.index({ studentId: 1, examId: 1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);
