const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET /api/admin/notifications - paginated, newest first
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const page = parseInt(req.query.page) || 1;

        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

// GET /api/admin/notifications/unread-count
router.get('/unread-count', async (req, res) => {
    try {
        const count = await Notification.countDocuments({ isRead: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch unread count' });
    }
});

// PATCH /api/admin/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
});

// PATCH /api/admin/notifications/mark-all-read
router.patch('/mark-all-read', async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to mark all as read' });
    }
});

module.exports = router;