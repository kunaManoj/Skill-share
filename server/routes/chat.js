const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

// GET messages for a booking
router.get('/:bookingId', async (req, res) => {
    try {
        const messages = await Message.find({ bookingId: req.params.bookingId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
