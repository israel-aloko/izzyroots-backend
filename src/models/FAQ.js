const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    question: {type: String, required: true, trim: true},
    answer: {type: String, required: true, trim: true},
    sortOrder: {type: Number, default: 0},
}, {timestamps: true});

faqSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('FAQ', faqSchema);