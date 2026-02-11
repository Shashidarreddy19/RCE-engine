const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String, // Can be linked to User model if needed
        default: null
    },
    language: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    input: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['queued', 'running', 'completed', 'timeout', 'error'],
        default: 'queued'
    },
    output: {
        type: String,
        default: ''
    },
    error: {
        type: String,
        default: ''
    },
    executionTime: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
