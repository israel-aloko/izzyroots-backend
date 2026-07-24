const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    packSize: { type: String },
    addedAt: { type: Date, default: Date.now }
}, { _id: false });

const wishlistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: {
        type: [wishlistItemSchema],
        default: []
    }
}, { timestamps: true });

wishlistSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Wishlist', wishlistSchema);