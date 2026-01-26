const express = require('express');
const Booking = require('../models/Booking');
const Skill = require('../models/Skill');
const User = require('../models/User');

const router = express.Router();

// POST Create Booking
router.post('/', async (req, res) => {
    try {
        const { studentId, providerId, skillId, date, note } = req.body;

        // Basic validation
        if (!studentId || !providerId || !skillId || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newBooking = new Booking({
            studentId,
            providerId,
            skillId,
            date: new Date(date),
            note
        });

        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Single Booking
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('skillId');
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Populate Student and Provider details
        const student = await User.findOne({ clerkId: booking.studentId });
        const provider = await User.findOne({ clerkId: booking.providerId });

        res.json({ ...booking.toObject(), student, provider });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET My Bookings (As Student or Provider)
router.get('/', async (req, res) => {
    try {
        const { userId, role } = req.query; // role = 'student' or 'provider'

        if (!userId) return res.status(400).json({ error: 'User ID required' });

        let query = {};
        if (role === 'provider') {
            query.providerId = userId;
        } else {
            query.studentId = userId;
        }

        const bookings = await Booking.find(query)
            .populate('skillId')
            .sort({ date: 1 }); // Soonest first

        // Enrich with other user's details
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            const otherUserId = role === 'provider' ? booking.studentId : booking.providerId;
            const otherUser = await User.findOne({ clerkId: otherUserId }, 'firstName lastName imageUrl email');
            return { ...booking.toObject(), otherUser };
        }));

        res.json(enrichedBookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH Update Status (Approve/Reject)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData = { status };

        // Generate meeting link if approved
        if (status === 'approved') {
            // Using Jitsi Meet for instant, no-login video calls
            // Format: https://meet.jit.si/SkillShare-Session-<BookingID>
            updateData.meetingLink = `https://meet.jit.si/SkillShare-Session-${req.params.id}`;
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
