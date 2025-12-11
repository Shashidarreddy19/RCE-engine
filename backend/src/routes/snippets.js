const express = require('express');
const Snippet = require('../models/Snippet');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/snippets
// @desc    Create a new snippet
// @access  Private
router.post('/', protect, async (req, res) => {
    const { title, description, code, language, tags, isPublic } = req.body;

    try {
        const snippet = await Snippet.create({
            userId: req.user._id,
            title,
            description,
            code,
            language,
            tags,
            isPublic,
        });

        res.status(201).json(snippet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/snippets
// @desc    Get all snippets for current user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const snippets = await Snippet.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.json(snippets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/snippets/:id
// @desc    Get snippet by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);

        if (snippet) {
            // Check if user owns the snippet or if it's public (future proofing)
            if (snippet.userId.toString() !== req.user._id.toString() && !snippet.isPublic) {
                return res.status(401).json({ message: 'Not authorized' });
            }
            res.json(snippet);
        } else {
            res.status(404).json({ message: 'Snippet not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/snippets/:id
// @desc    Update snippet
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const { title, description, code, language, tags, isPublic } = req.body;

    try {
        const snippet = await Snippet.findById(req.params.id);

        if (snippet) {
            if (snippet.userId.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            snippet.title = title || snippet.title;
            snippet.description = description || snippet.description;
            snippet.code = code || snippet.code;
            snippet.language = language || snippet.language;
            snippet.tags = tags || snippet.tags;
            snippet.isPublic = isPublic !== undefined ? isPublic : snippet.isPublic;

            const updatedSnippet = await snippet.save();
            res.json(updatedSnippet);
        } else {
            res.status(404).json({ message: 'Snippet not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/snippets/:id
// @desc    Delete snippet
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);

        if (snippet) {
            if (snippet.userId.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            await snippet.deleteOne();
            res.json({ message: 'Snippet removed' });
        } else {
            res.status(404).json({ message: 'Snippet not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
