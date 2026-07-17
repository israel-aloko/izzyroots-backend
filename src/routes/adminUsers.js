const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const { sendAdminInviteEmail } = require('../services/emailService');

function generateTempPassword() {
    return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Fetch users error:', err);
        res.status(500).json({ message: 'Failed to fetch users'});
    }
});

// POST /api/admin/users/invite - create a new admin account and email them a temporary password
router.post('/invite', async (req, res) => {
    try {
        const { fullname, email } = req.body;

        if (!fullname || !email) {
            return res.status(400).json({ message: 'Full name and email are required' });
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ message: 'A user with this email already exists' });
        }

        const tempPassword = generateTempPassword();
        const hashed = await bcrypt.hash(tempPassword, 10);

        const newAdmin = await User.create({
            fullname: fullname.trim(),
            email: email.trim(),
            password: hashed,
            role: 'admin',
            isActive: true,
            verified: true,
            provider: 'local'
        });

        await sendAdminInviteEmail(newAdmin.email, newAdmin.fullname, tempPassword);

        const { password, ...safeUser } = newAdmin.toObject();
        res.status(201).json(safeUser);
    } catch (err) {
        console.error('Invite admin error:', err);
        res.status(500).json({ message: 'Failed to send admin invite' });
    }
});

// PUT /api/admin/users/:id/role - change a user's role
// router.put('/:id/role', async (req, res) => {
//     try {
//         const { role } = req.body;

//         if (!['customer', 'admin'].includes(role)) {
//             return res.status(400).json({ message: 'Role must be "customer" or "admin"' });
//         }

//         const user = await User.findById(req.params.id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         if (String(user._id) === String(req.user._id) && role !== 'admin') {
//             return res.status(400).json({ message: 'You cannot change your own role' });
//         }

//         if (user.role === 'admin' && role === 'customer') {
//             const adminCount = await User.countDocuments({ role: 'admin' });
//             if (adminCount <= 1) {
//                 return res.status(400).json({ message: 'Cannot demote the last remaining admin' });
//             }
//         }

//         user.role = role;
//         await user.save();

//         const { password, ...safeUser } = user.toObject();
//         res.json(safeUser);
//     } catch (err) {
//         console.erroor('Update user role error:', err);
//         res.status(500).json({ message: 'Failed to update user role' });
//     }
// });

// PUT /api/admin/users/:id/status - activate or deactivate a user
router.put('/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be true or false' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (String(user._id) === String(req.user._id) && !isActive) {
            return res.status(400).json({ message: 'You cannot deactivate your own account' });
        }

        if (user.role === 'admin' && !isActive) {
            const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
            if (activeAdminCount <= 1) {
                return res.status(400).json({ message: 'Cannot deactivate the last remaining active admin' });
            }
        }

        user.isActive = isActive;
        await user.save();
        const { password, ...safeUser } = user.toObject();
        res.json(safeUser);
    } catch (err) {
        console.error('Update user status error:', err);
        res.status(500).json({ message: 'Failed to update user status' });
    }
});


// DELETE /api/admin/users/:id
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (String(user._id) === String(req.user._id)) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last remaining admin' });
            }
        }

        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

module.exports = router;
