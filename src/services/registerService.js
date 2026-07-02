const bcrypt = require('bcrypt');
const User = require('../models/User');
const VerificationToken = require('../models/VerificationToken');
const { sendOtp } = require('./emailService');

const SALT_ROUNDS = 10;

function generateOtp() {
    return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

async function register({ fullname, email, password, role }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const err = new Error('User already exists');
        err.status = 409;
        throw err;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const otp = generateOtp();

    await VerificationToken.deleteMany({ email });
    await VerificationToken.create({
        email,
        otp,
        fullname,
        password: hashedPassword,
        role: role || 'customer',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await sendOtp(email, otp);

    return { email, message: 'OTP sent. Please verify to complete registration.'};
}

//user submits otp
async function verifyOtp(email, otp) {
    const token = await VerificationToken.findOne({ email, otp });

    if (!token) {
        const err = new Error('Invalid OTP');
        err.status = 400;
        throw err;
    }

    if (token.expiresAt < new Date()) {
        const err = new Error('OTP has expired');
        err.status = 400;
        throw err;
    }

    const user = await User.create({
        fullname: token.fullname,
        email: token.email,
        password: token.password,
        role: token.role,
        verified: true,
    });

    await VerificationToken.deleteMany({ email });

    return {
        userId: String(user._id),
        fullname: user.fullname,
        role: user.role,
    };
}

module.exports = { register, verifyOtp };