const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// Create a complaint
router.post('/', async (req, res) => {
    try {
        const { userId, userEmail, userName, title, description } = req.body;

        if (!userId || !title || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newComplaint = new Complaint({
            userId,
            userEmail,
            userName,
            title,
            description
        });

        await newComplaint.save();
        res.status(201).json(newComplaint);
    } catch (err) {
        console.error("Error creating complaint:", err);
        res.status(500).json({ error: 'Failed to submit complaint' });
    }
});

// Get all complaints (Admin)
router.get('/', async (req, res) => {
    try {
        // In a real app, verify admin status here
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        console.error("Error fetching complaints:", err);
        res.status(500).json({ error: 'Failed to fetch complaints' });
    }
});

// Get user's complaints
router.get('/user/:userId', async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user complaints' });
    }
});

// Resolve complaint
router.patch('/:id/resolve', async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status: 'resolved' },
            { new: true }
        );

        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

        // Create notification for the user (lazy load model to avoid circular deps if any)
        try {
            const Notification = require('../models/Notification');
            await Notification.create({
                userId: complaint.userId,
                type: 'system',
                title: 'Complaint Resolved',
                message: `Your complaint regarding "${complaint.title}" has been reviewed and resolved.`,
                link: '/complaint'
            });
        } catch (notifErr) {
            console.error("Failed to send notification:", notifErr);
            // Don't fail the request if notification fails, but log it
        }

        res.json(complaint);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to resolve complaint' });
    }
});

module.exports = router;
