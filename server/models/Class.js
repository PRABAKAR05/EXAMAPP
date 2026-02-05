const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    // Standard Class Details
    name: { 
        type: String, 
        required: [true, 'Subject Name is required'], 
        trim: true 
    },
    subjectCode: { 
        type: String, 
        trim: true,
        uppercase: true 
    },
    batch: { 
        type: String, 
        trim: true 
    },

    // Strict: Exactly One Teacher
    teacherId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null
    },

    // Strict: Max 50 Students
    studentIds: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }],
    
    // Constant Limit
    maxCapacity: {
        type: Number,
        default: 50,
        immutable: true // Prevent editing this later
    },

    // Lifecycle Management
    status: {
        type: String,
        enum: ['draft', 'active', 'archived'],
        default: 'draft'
    }
}, {
    timestamps: true
});

// Middleware to enforce strict 50 student limit at database level
ClassSchema.pre('save', function(next) {
    if (this.studentIds.length > this.maxCapacity) {
        throw new Error('Class capacity cannot exceed 50 students.');
    }
    next();
});

// Optimization Indices
ClassSchema.index({ teacherId: 1 });   // For Teacher's "My Classes"
ClassSchema.index({ studentIds: 1 });  // For Student's "My Classes"
ClassSchema.index({ subjectCode: 1 }); // For Admin filtering

module.exports = mongoose.model('Class', ClassSchema);
