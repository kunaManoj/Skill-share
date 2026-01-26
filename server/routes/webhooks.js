const express = require('express');
const { Webhook } = require('svix');
const User = require('../models/User');

const router = express.Router();

router.post('/clerk', async (req, res) => {
    const payload = req.body;
    const headers = req.headers;

    const wh = new Webhook(process.env.WEBHOOK_SECRET);
    let evt;

    try {
        evt = wh.verify(JSON.stringify(payload), headers);
    } catch (err) {
        console.error('Webhook Verification Failed:', err);
        return res.status(400).json({ error: 'Webhook Error' });
    }

    const { id, type } = evt;
    const data = evt.data;

    console.log(`Webhook received: ${type}`);

    if (type === 'user.created' || type === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url } = data;
        const email = email_addresses[0].email_address;

        try {
            await User.findOneAndUpdate(
                { clerkId: id },
                {
                    clerkId: id,
                    email,
                    firstName: first_name,
                    lastName: last_name,
                    imageUrl: image_url,
                    // Check if email contains 'admin' OR is in the specific admin list
                    role: (email.toLowerCase().includes('admin') || ['manojkuna2005@gmail.com', 'owner@unirent.com'].includes(email)) ? 'admin' : undefined, // Don't overwrite to student if they were manually made admin, unless we want strict sync.
                    // Actually, let's use the $set and $setOnInsert pattern for robustness if we wanted to be partial, but here let's just force ADMIN if matches, otherwise leave as is or default to student on insert.
                    // Simplified: If match -> admin. If no match -> don't touch (undefined) -> wait, if undefined it won't be in the update object.
                    // But we want to ensure new users are students.
                    // Let's go with:
                    // role: isAdmin ? 'admin' : 'student' (but this demotes manual admins).
                    // The user specifically wants their email to work.
                    // So:
                    role: (email.toLowerCase().includes('admin') || ['manojkuna2005@gmail.com'].includes(email)) ? 'admin' : 'student',
                    updatedAt: new Date(),
                },
                { upsert: true, new: true }
            );
            console.log('User synced to MongoDB:', email);
        } catch (err) {
            console.error('Error syncing user:', err);
            return res.status(500).json({ error: 'Database Error' });
        }
    }

    res.status(200).json({ success: true });
});

module.exports = router;
