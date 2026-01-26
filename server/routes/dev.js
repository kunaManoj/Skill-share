const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/dev/sync-user
router.post('/sync-user', async (req, res) => {
    try {
        const { clerkId, email, firstName, lastName, imageUrl } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Check for admin list or keyword
        const normEmail = email.toLowerCase().trim();
        const isAdmin = normEmail.includes('admin') ||
            ['manojkuna2005@gmail.com', 'owner@unirent.com'].includes(normEmail);

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
        } else {
            // Optional: If you want to demote non-admins, uncomment below. 
            // But usually we just want to promote.
            // updateData.role = 'student';
        }

        const user = await User.findOneAndUpdate(
            { clerkId },
            {
                $set: updateData,
                $setOnInsert: { role: isAdmin ? 'admin' : 'student', createdAt: new Date() }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/dev/make-admin
// Body: { userId } (clerkId)
router.post('/make-admin', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'Missing userId' });

        const user = await User.findOneAndUpdate(
            { clerkId: userId },
            { role: 'admin' },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
