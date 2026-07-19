const jwt = require('jsonwebtoken');
const User = require('../models/User'); // adjust path/casing to match your project

const isAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Not authenticated. Please log in.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found.' });
        }

        if (!['admin', 'superadmin'].includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('isAdmin middleware error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

const isSuperAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Not authenticated. Please log in.'});
        }

        if (user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied. Super admins only.'});
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('isSuperAdmin middleware error:', error.message);
        return res.status(401).json({message: 'Invalid or expired token.'});
    }
}

module.exports = {isAdmin, isSuperAdmin};