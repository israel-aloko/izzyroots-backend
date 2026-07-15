const mongoose = require('mongoose');
const {Schema} = mongoose;

const orderItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {type: String, required: true}, //snapshot at time of order'
    packSize: {type: String},
    variantId: {type: mongoose.Schema.Types.ObjectId},
    price: {type: Number, required: true},
    quantity: {type: Number, required: true, min: 1}
}, {_id: false});

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: v => Array.isArray(v) && v.length > 0
    },

    //delivery details(from checkout form)
    fullname: {type: String, required: true},
    email: {type: String, required: true},
    phone: {type: String, required: true},
    address: {type: String, required: true},
    country: {type: String, required: true, default: 'Nigeria'},
    region: {type: String, required: true},
    notes: {type: String},

    subtotal: {type: Number, required: true},
    deliveryFee: {type: Number, required: true},
    total: {type: Number, required: true},

    status: {
        type: String,
        enum: ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending_payment'
    },

    //payment tracking
    paymentReference: {type: String, unique: true, sparse: true}, //paystack reference
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'failed'],
        default: 'unpaid'
    },
    paidAt: {type: Date}

}, {timestamps: true});

orderSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Order', orderSchema);