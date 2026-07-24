const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            'new_order',
            'payment_received',
            'support_ticket',
            'refund_requested',
            'refund_processed',
            'new_review',
            'low_stock'
        ],
        required: true
    },
    message: { type: String, required: true },
    link: { type: String }, // e.g. /admin/orders/:id
    isRead: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // order/ticket/review/product id
}, { timestamps: true });

notificationSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Notification', notificationSchema);