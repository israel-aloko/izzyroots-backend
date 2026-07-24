const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const isAuthenticated = require('../middleware/isAuthenticated');
const uploadTickets = require('../middleware/uploadTicketimages');
const {sendGuestMessage} = require('../services/emailService');
const { createNotification } = require('../services/notificationService');


router.post('/', isAuthenticated, uploadTickets.array('images', 5), async (req, res) => {
    try {
        const {type, subject, description, order} = req.body;
        const images = req.files ? req.files.map((f) => f.path) : [];

        const ticket = await SupportTicket.create({
            customer: req.user.id,
            type,
            subject,
            description,
            order: order || undefined,
            images,
        });

        await createNotification(
            'support_ticket',
            `New ${type} ticket: ${subject}`,
            `/admin/supportTickets`,
            ticket._id
        );

        res.status(201).json(ticket);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
});

//post /api/support-tickets - customer raises a ticket
// router.post('/', isAuthenticated, async (req, res) => {
//     try {
//         const { type, subject, description, order, images } = req.body;

//         const ticket = await SupportTicket.create({
//             customer: req.user.id,
//             type,
//             subject,
//             description,
//             order: order || undefined,
//             images: images || [],
//         });

//         res.status(201).json(ticket);
//     } catch (err) {
//         res.status(400).json({ message: err.message});
//     }
// });

//POST /api/support-tickets/guest-message - not logged in, email support directly, no DB record
router.post('/guest-message', async (req, res) => {
    try {
        const {fullname, email, phone, country, region, message} = req.body;

        if (!fullname || !email || !message) {
            return res.status(400).json({message: 'Name, email, and message are required'});
        }

        await sendGuestMessage({ fullname, email, phone, country, region, message });

        res.status(200).json({message: 'Message sent'});
    } catch (err) {
        console.error('Guest message error:', err);
        res.status(500).json({ message: 'Failed to send message'});
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

// POST /api/support-tickets/:id/images
//used when the admin requests more evidence after the initial submission
router.post('/:id/images', isAuthenticated, uploadTickets.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }

        const ticket = await SupportTicket.findOne({ _id: req.params.id, customer: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.images.push(...req.files.map((f) => f.path));
        ticket.imagesRequested = false; // clear the flag once photos come in
        await ticket.save();

        res.json(ticket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;