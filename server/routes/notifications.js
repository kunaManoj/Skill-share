const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET Notifications for a user
router.get('/:userId', async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH Mark as Read
router.patch('/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create Notification (Internal/System use)
router.post('/', async (req, res) => {
    try {
        const { userId, type, title, message, link } = req.body;
        const notification = new Notification({ userId, type, title, message, link });
        await notification.save();
        res.status(201).json(notification);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
