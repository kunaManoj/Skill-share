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

        // Notify Provider of new request
        const Notification = require('../models/Notification');
        // Fetch skill to get title for the message if not populated, but here we only have skillId.
        // We can fetch skill title or just say "New Booking Request". 
        // Let's populate or fetch skill quickly.
        const skill = await Skill.findById(skillId);
        await Notification.create({
            userId: providerId,
            type: 'booking',
            title: 'New Booking Request',
            message: `You have a new booking request for "${skill ? skill.title : 'a skill'}".`,
            link: '/bookings' // Direct them to bookings page to approve/reject
        });

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
            .sort({ createdAt: -1 }); // Recently created first

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

const Notification = require('../models/Notification'); // Add this import at the top if not present, but for now I'll use it inside assuming it's imported or I will add the import line separately.
// Actually, let's just do the router update and assume I can place the require at the top in another edit or context.
// Wait, I should add the require at top first. Let's do this in 2 steps or just use require inside.
// Better: I will use require inside for safety or update the whole file import section.
// Strategy: I will update the whole route handler block.

// PATCH Update Status (Approve/Reject)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        // Added payment_pending to allowed statuses
        if (!['approved', 'rejected', 'completed', 'cancelled', 'payment_pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData = { status };

        // Generate meeting link if approved
        if (status === 'approved') {
            // Using internal meeting room
            updateData.meetingLink = `/meeting/${req.params.id}`;
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('skillId');

        // Create Notifications based on Status Change
        const Notification = require('../models/Notification');

        if (status === 'approved') {
            // Notify Student
            await Notification.create({
                userId: booking.studentId,
                type: 'booking',
                title: 'Booking Approved!',
                message: `Your session for "${booking.skillId.title}" has been approved.`,
                link: `/chat?booking=${booking._id}`
            });
        } else if (status === 'payment_pending') {
            // Notify Student to Pay
            await Notification.create({
                userId: booking.studentId,
                type: 'payment',
                title: 'Payment Requested',
                message: `Please complete payment for "${booking.skillId.title}" to finalize the session.`,
                link: `/chat?booking=${booking._id}`
            });
        } else if (status === 'completed') {
            // Notify Provider
            await Notification.create({
                userId: booking.providerId,
                type: 'system',
                title: 'Session Completed',
                message: `Session for "${booking.skillId.title}" marked as completed.`,
                link: `/wallet`
            });
        }

        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
