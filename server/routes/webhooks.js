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
                    role: (email.toLowerCase().includes('admin') || ['manojkuna2005@gmail.com', 'owner@skillshare.com'].includes(email)) ? 'admin' : 'student',
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
