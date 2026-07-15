const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const isAuthenticated = require('../middleware/isAuthenticated');

//post /api/support-tickets - customer raises a ticket
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { type, subject, description, order, images } = req.body;

        const ticket = await SupportTicket.create({
            customer: req.user.id,
            type,
            subject,
            description,
            order: order || undefined,
            images: images || [],
        });

        res.status(201).json(ticket);
    } catch (err) {
        res.status(400).json({ message: err.message});
    }
});

//GET /api/support-tickets/mine - customer's own tickets
//registered before any /:id route to avoid CastError on 'mine'
router.get('/mine', isAuthenticated, async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ customer: req.user.id})
            .populate('order', '_id')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch tickets'});
    }
}); 

module.exports = router;