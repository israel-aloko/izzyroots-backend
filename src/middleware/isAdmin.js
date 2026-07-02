const jwt = require('jsonwebtoken');

const isAdmin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated'});

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access required'});
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token'});
    }
};

module.exports = isAdmin;