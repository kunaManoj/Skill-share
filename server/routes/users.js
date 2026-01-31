const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users/sync
router.post('/sync', async (req, res) => {
    try {
        const { clerkId, email, firstName, lastName, imageUrl } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Check for admin list or keyword
        const normEmail = email.toLowerCase().trim();
        const isAdmin = normEmail.includes('admin') ||
            ['manojkuna2005@gmail.com', 'owner@skillshare.com'].includes(normEmail);

        const updateData = {
            clerkId,
            email,
            firstName,
            lastName,
            imageUrl,
            updatedAt: new Date()
        };

        if (isAdmin) {
            updateData.role = 'admin';
        }

        const setOnInsert = { createdAt: new Date() };
        if (!isAdmin) {
            setOnInsert.role = 'student';
        }

        const user = await User.findOneAndUpdate(
            { clerkId },
            {
                $set: updateData,
                $setOnInsert: setOnInsert
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, user });
    } catch (err) {
        console.error("Sync Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
