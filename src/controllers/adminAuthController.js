const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User'); // adjust path/casing to match your project

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

// POST /api/admin/login
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'This account uses Google Sign-In. Please continue with Google.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken(user._id);
        setTokenCookie(res, token);

        return res.status(200).json({
            message: 'Login successful.',
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('adminLogin error:', error.message);
        return res.status(500).json({ message: 'Server error during login.' });
    }
};

// POST /api/admin/google-login
exports.adminGoogleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required.' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload.email.toLowerCase();

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'No account found for this email.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const token = generateToken(user._id);
        setTokenCookie(res, token);

        return res.status(200).json({
            message: 'Login successful.',
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('adminGoogleLogin error:', error.message);
        return res.status(401).json({ message: 'Invalid Google credential.' });
    }
};

// GET /api/admin/me
exports.getAdminProfile = async (req, res) => {
    // req.user is set by isAdmin middleware
    return res.status(200).json({
        user: {
            id: req.user._id,
            fullname: req.user.fullname,
            email: req.user.email,
            role: req.user.role,
        },
    });
};

// POST /api/admin/logout
exports.adminLogout = async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.status(200).json({ message: 'Logged out successfully.' });
};