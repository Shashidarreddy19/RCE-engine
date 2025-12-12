const express = require('express');
const uuidv4 = (...args) => import('uuid').then(mod => mod.v4(...args));
const rateLimit = require('express-rate-limit');
const Submission = require('../models/Submission');
const { jobQueue } = require('../queue');

const router = express.Router();

// Rate Limiting: 10 requests per minute
const submissionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { error: 'Too many submissions, please try again later.' }
});

router.post('/execute', submissionLimiter, async (req, res) => {
    const { code, language, input } = req.body;

    if (!code || !language) {
        return res.status(400).json({ message: 'Code and language are required' });
    }

    const jobId = await uuidv4();

    try {
        // Create Submission Record
        const submission = new Submission({
            jobId,
            language,
            code,
            input,
            status: 'queued'
        });
        await submission.save();

        // Add to Queue
        await jobQueue.add('execute-job', {
            jobId,
            code,
            language,
            input
        });

        res.json({
            jobId,
            status: 'queued',
            message: 'Job submitted successfully'
        });

    } catch (err) {
        console.error('Submission error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/status/:jobId', async (req, res) => {
    const { jobId } = req.params;

    try {
        const submission = await Submission.findOne({ jobId });

        if (!submission) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json({
            jobId: submission.jobId,
            status: submission.status,
            output: submission.output,
            error: submission.error,
            executionTime: submission.executionTime,
            created: submission.createdAt,
            completed: submission.completedAt
        });

    } catch (err) {
        console.error('Status check error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/result/:jobId', async (req, res) => {
    // Alias for /status, but maybe strictly returns result if completed
    const { jobId } = req.params;
    try {
        const submission = await Submission.findOne({ jobId });
        if (!submission) return res.status(404).json({ message: 'Job not found' });

        res.json(submission);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching result' });
    }
});

module.exports = router;
