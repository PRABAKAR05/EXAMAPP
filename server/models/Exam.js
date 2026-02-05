const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    duration: {
        type: Number, // In minutes
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    passingMarks: {
        type: Number,
        default: 0
    },
    scheduledStart: {
        type: Date,
        required: true
    },
    scheduledEnd: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: false // Draft mode by default
    },
    accessType: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        default: null
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    strictMode: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Optimizing Queries
examSchema.index({ createdBy: 1 }); // For Teacher Dashboard
examSchema.index({ classId: 1 });   // For Filtering Private Exams
examSchema.index({ isActive: 1 });  // For Public Exam listing

module.exports = mongoose.model('Exam', examSchema);
