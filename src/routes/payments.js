const express = require('express');
const router = express.Router();
const https = require('https');
const Order = require('../models/Order');
const Product = require('../models/Product');
const isAuthenticated = require('../middleware/isAuthenticated');
const {sendReceiptEmail} = require('../services/emailService');

// helper: call Paystack's verify endpoint using the secret key
function verifyWithPaystack(reference) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.paystack.co',
            path: `/transaction/verify/${encodeURIComponent(reference)}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
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
        request.end();
    });
}

// POST /payments/verify - called by frontend after Paystack popup succeeds
router.post('/verify', isAuthenticated, async (req, res) => {
    try {
        const { reference } = req.body;
        if (!reference) {
            return res.status(400).json({ message: 'Payment reference is required' });
        }

        const order = await Order.findOne({ paymentReference: reference });
        if (!order) {
            return res.status(404).json({ message: 'Order not found for this reference' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this order' });
        }

        // idempotency guard - if already verified, don't decrement stock twice
        if (order.paymentStatus === 'paid') {
            return res.json(order);
        }

        const verification = await verifyWithPaystack(reference);

        if (!verification.status || verification.data?.status !== 'success') {
            order.paymentStatus = 'failed';
            await order.save();
            return res.status(400).json({ message: 'Payment verification failed', order });
        }

        const expectedKobo = Math.round(order.total * 100);
        if (verification.data.amount !== expectedKobo) {
            console.error(`Amount mismatch for order ${order.id}: expected ${expectedKobo}, got ${verification.data.amount}`);
            order.paymentStatus = 'failed';
            await order.save();
            return res.status(400).json({ message: 'Payment amount mismatch' });
        }

        // payment confirmed - decrement stock per item
        for (const item of order.items) {
            if (item.variantId) {
                await Product.updateOne(
                    { _id: item.product, 'variants._id': item.variantId },
                    { $inc: { 'variants.$.stock': -item.quantity } }
                );
            } else {
                await Product.updateOne(
                    { _id: item.product },
                    { $inc: { stockCount: -item.quantity } }
                );
            }
        }

        order.paymentStatus = 'paid';
        order.status = 'paid';
        order.paidAt = new Date();
        await order.save();

        try {
            await sendReceiptEmail(order);
        } catch (emailErr) {
            console.error('Receipt email failed:', emailErr);
        }

        res.json(order);
    } catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
});

module.exports = router;