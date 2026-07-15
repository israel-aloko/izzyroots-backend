const mongoose = require('mongoose');

const TICKET_TYPES = ['return', 'refund', 'wrong_item', 'spoiled_delivery', 'general'];
const ORDER_REQUIRED_TYPES = ['return', 'refund', 'wrong_item', 'spoiled_delivery'];
const TICKET_STATUSES = ['open', 'in_review', 'approved', 'rejected', 'resolved'];
const REFUND_STATUSES = ['not_requested', 'pending', 'processing', 'processed', 'failed', 'needs_attention'];

const supportTicketSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    type: { type: String, enum: TICKET_TYPES, required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    images: [{ type: String }], // Cloudinary URLs
    imagesRequested: {type: Boolean, default: false},
    status: { type: String, enum: TICKET_STATUSES, default: 'open' },
    adminNote: { type: String, trim: true, default: '' },
    refund: {
        requested: { type: Boolean, default: false },
        amount: { type: Number }, // kobo
        paystackReference: { type: String },
        status: { type: String, enum: REFUND_STATUSES, default: 'not_requested' },
        processedAt: { type: Date },
    },
}, {timestamps: true});

//order-linked types must reference an order; general inquiries don't need one
supportTicketSchema.pre('validate', function () {
    if (ORDER_REQUIRED_TYPES.includes(this.type) && !this.order) {
        throw new Error(`An order is required for ticket type "${this.type}"`);
    }
});

supportTicketSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);