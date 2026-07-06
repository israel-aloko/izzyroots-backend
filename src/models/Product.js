const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    packSize: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    sku: {type: String, required: true}
}, { _id: true });

const productSchema = new mongoose.Schema({
    name: {type: String, required: true},
    localName: {type: String}, //eg: "ugu", "efo riro"
    category: {
        type: String, 
        required: true,
        enum: ['Leafy Veg', 'Fruit Veg', 'Grains', 'Herbs & Spices']
    },
    description: {type: String},
    image: { type: String, required: true}, //for the cover photo
    images: [{ type: String }], //full gallery, product detail carousel
    price: {type: Number, required: true},
    variants: [variantSchema],
    isActive: { type: Boolean, default: true}
}, {timestamps: true});

module.exports = mongoose.model('Product', productSchema);