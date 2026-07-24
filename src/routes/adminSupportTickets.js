const express = require('express');
const router = express.Router();
const https = require('https');
const SupportTicket = require('../models/SupportTicket');

//get /api/admin/support-tickets - list all
router.get('/', async (req, res) => {
    try {
        const { status, type, search } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;

        let tickets = await SupportTicket.find(filter)
            .populate('customer', 'fullname email')
            .populate('order', 'total paymentStatus')
            .sort({ createdAt: -1});

        if (search) {
            const term = search.toLowerCase();
            tickets = tickets.filter(t =>  
                t.subject.toLowerCase().includes(term) ||
                t.customer?.fullname?.toLowerCase().includes(term) ||
                t.customer?.email?.toLowerCase().includes(term)
            );
        }
        
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch tickets'})
    }
});

// PATCH /api/admin/support-tickets/:id/status — update status + adminNote together
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, adminNote, imagesRequested } = req.body;
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('customer', 'fullname email')
            .populate('order', 'total paymentStatus');
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (status) ticket.status = status;
        if (adminNote !== undefined) ticket.adminNote = adminNote;
        if (imagesRequested !== undefined) ticket.imagesRequested = imagesRequested;
        await ticket.save();

        res.json(ticket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// helper: call Paystack's refund endpoint using the secret key — mirrors verifyWithPaystack in payments.js
function refundWithPaystack(transactionReference, amountKobo) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            transaction: transactionReference,
            amount: amountKobo,
        });

        const options = {
            hostname: 'api.paystack.co',
            path: '/refund',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(err);
                }
            });
        });

        request.on('error', reject);
        request.write(payload);
        request.end();
    });
}

// map Paystack's refund status to our schema's enum (needs-attention has a hyphen on their side, underscore on ours)
function mapRefundStatus(paystackStatus) {
    const map = {
        pending: 'pending',
        processing: 'processing',
        processed: 'processed',
        failed: 'failed',
        'needs-attention': 'needs_attention',
    };
    return map[paystackStatus] || 'pending';
}

// POST /api/admin/support-tickets/:id/refund — trigger an actual Paystack refund
// Optional body: { amount } in Naira, for a partial refund. Omit for a full refund.
router.post('/:id/refund', async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('customer', 'fullname email')
            .populate('order');
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        if (!ticket.order) return res.status(400).json({ message: 'This ticket has no associated order' });
        if (ticket.order.paymentStatus !== 'paid') {
            return res.status(400).json({ message: 'Order was never successfully paid — nothing to refund' });
        }

        const { amount } = req.body; // Naira, optional
        const amountKobo = amount ? Math.round(amount * 100) : Math.round(ticket.order.total * 100);

        const refundResponse = await refundWithPaystack(ticket.order.paymentReference, amountKobo);

        if (!refundResponse.status) {
            return res.status(400).json({ message: refundResponse.message || 'Refund request failed' });
        }

        const refundData = refundResponse.data;
        const mappedStatus = mapRefundStatus(refundData.status);

        ticket.refund = {
            requested: true,
            amount: amountKobo,
            paystackReference: String(refundData.id),
            status: mappedStatus,
            processedAt: mappedStatus === 'processed' ? new Date() : undefined,
        };
        if (ticket.status === 'open' || ticket.status === 'in_review') {
            ticket.status = 'approved';
        }

        await ticket.save();

        ticket.order.status = 'refunded';
        await ticket.order.save();

        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error('Refund error:', err);
        res.status(500).json({ message: 'Failed to process refund' });
    }
});

module.exports = router;