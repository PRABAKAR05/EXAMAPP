const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true, default: false }
    }],
    marks: {
        type: Number,
        required: true,
        default: 1
    },
    type: {
        type: String,
        enum: ['mcq'],
        default: 'mcq'
    }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
