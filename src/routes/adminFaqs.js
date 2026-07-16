const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');

//GET /api/admin/faqs
router.get('/', async (req, res) => {
    try {
        const faqs = await FAQ.find().sort({ sortOrder: 1, createdAt: 1});
        res.json(faqs);
    } catch (err) {
        res.status(500).json({message: 'Failed to fectch FAQs'});
    }
});

// POST /api/admin/faqs
router.post('/', async (req, res) => {
    try {
        const { question, answer, sortOrder } = req.body;
        if (!question || !answer) {
            return res.status(400).json({ message: 'Question and answer are required' });
        }
        const faq = await FAQ.create({ question, answer, sortOrder: sortOrder || 0 });
        res.status(201).json(faq);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH /api/admin/faqs/:id
router.patch('/:id', async (req, res) => {
    try {
        const { question, answer, sortOrder } = req.body;
        const faq = await FAQ.findById(req.params.id);
        if (!faq) return res.status(404).json({ message: 'FAQ not found' });

        if (question !== undefined) faq.question = question;
        if (answer !== undefined) faq.answer = answer;
        if (sortOrder !== undefined) faq.sortOrder = sortOrder;
        await faq.save();

        res.json(faq);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/admin/faqs/:id
router.delete('/:id', async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndDelete(req.params.id);
        if (!faq) return res.status(404).json({ message: 'FAQ not found' });
        res.json({ message: 'FAQ deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete FAQ' });
    }
});

module.exports = router;