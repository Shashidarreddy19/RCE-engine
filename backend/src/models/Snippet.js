const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    code: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
        enum: ['python', 'java', 'cpp', 'javascript', 'c', 'go'],
    },
    tags: [{
        type: String,
    }],
    isPublic: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Snippet = mongoose.model('Snippet', snippetSchema);

module.exports = Snippet;
