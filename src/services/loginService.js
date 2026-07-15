const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {expiresIn: '7d'});
}

async function login({ email, password }) {
    const user = await User.findOne({ email });

    if (!user) {
        return { userId: null, fullname: null, role: null, message: 'User not found' };
    }

    if (!user.isActive) {
        return { userId: null, fullname: null, role: null, message: 'Your account has been deactivated. Please contact support.'};
    }

    if (!user.verified) {
        return { userId: null, fullname: null, role: null, message: 'Email not verified. Please check your inbox.'}
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
        return { userId: null, fullname: null, role: null, message: 'Invalid password' };
    }

    return {
        userId: String(user._id),
        fullname: user.fullname,
        role: user.role,
        token: generateToken(user._id),
        message: 'Login successful',
    };
}

async function handleGoogleLogin(idToken) {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return { userId: null, fullname: null, role: null, message: 'Invalid Google token'};
        }
        
        const { email, name } = payload;

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                email,
                fullname: name,
                role: 'customer',
                verified: true,
                password: '',
                provider: 'google',
            });
        }

        if (!user.isActive) {
            return {userId: null, fullname: null, role: null, message: 'Your account has been deactivated. Please contact support.'};
        }

        return {
            userId: String(user._id),
            fullname: user.fullname,
            role: user.role,
            token: generateToken(user._id),
            message: "Login successful",
        };
    } catch (err) {
        return { userId: null, fullname: null, role: null, message: `Google login failed: ${err.message}` };
    }
}

module.exports = { login, handleGoogleLogin };