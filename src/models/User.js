const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true},
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    verified: { type: Boolean, default: false },
    provider: { type: String, default: 'local' },
    isActive: { type: Boolean, default: true}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);