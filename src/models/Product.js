const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    packSize: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    sku: {type: String, required: true}
}, { _id: true });

const productSchema = new mongoose.Schema({
    name: {type: String, required: true},
    localName: {type: String},
    category: {
        type: String, 
        required: true,
        trim: true,
    },
    description: {type: String},
    maturityPeriod: { type: String},
    plantingSeason: {type: String},
    instructions: {type: String},
    image: { type: String, required: true}, //for the cover photo
    images: [{ type: String }], //full gallery, product detail carousel
    price: {type: Number, required: true},
    stockCount: {type: Number, default: 0},
    variants: [variantSchema],
    isActive: { type: Boolean, default: true}
}, {timestamps: true});

productSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
})

module.exports = mongoose.model('Product', productSchema);