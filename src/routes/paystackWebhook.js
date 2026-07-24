// routes/paystackWebhook.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');

const REFUND_EVENT_STATUS = {
    'refund.pending': 'pending',
    'refund.processing': 'processing',
    'refund.processed': 'processed',
    'refund.failed': 'failed',
    'refund.needs-attention': 'needs_attention',
};

// POST /api/webhooks/paystack
router.post('/', async (req, res) => {
    // Verify the event actually came from Paystack
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).send('Invalid signature');
    }

    // Acknowledge immediately — Paystack times out at 30s and retries on non-200
    res.sendStatus(200);

    const { event, data } = req.body;
    const mappedStatus = REFUND_EVENT_STATUS[event];
    if (!mappedStatus) return; // not a refund event we care about (charge.success, etc.)

    try {
        const ticket = await SupportTicket.findOne({ 'refund.paystackReference': String(data.id) });
        if (!ticket) return;

        ticket.refund.status = mappedStatus;
        if (mappedStatus === 'processed') ticket.refund.processedAt = new Date();
        if (mappedStatus === 'processed' && ticket.status !== 'resolved') {
            ticket.status = 'resolved';
        }

        await ticket.save();
    } catch (err) {
        console.error('Paystack webhook processing error:', err);
    }
});

module.exports = router;