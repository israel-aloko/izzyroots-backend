const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');

//GET /api/faqs - public, no auth required
router.get('/', async (req, res) => {
    try {
        const faqs = await FAQ.find().sort({ sortOrder: 1, createdAt: 1});
        res.json(faqs);
    } catch (err) {
        res.status(500).json({message: 'Failed to fetch FAQs'});
    }
});

module.exports = router;