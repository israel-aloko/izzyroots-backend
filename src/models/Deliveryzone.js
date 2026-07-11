const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
    state: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    fee: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {type: Boolean, default: true}
}, {timestamps: true});

deliveryZoneSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);