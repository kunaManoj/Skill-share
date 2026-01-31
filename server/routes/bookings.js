const express = require('express');
const Booking = require('../models/Booking');
const Skill = require('../models/Skill');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Escrow = require('../models/Escrow');
const Review = require('../models/Review');

const router = express.Router();

// POST Create Booking (Initial - pending payment)
router.post('/', async (req, res) => {
    try {
        const { studentId, providerId, skillId, date, note } = req.body;

        // Basic validation
        if (!studentId || !providerId || !skillId || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Fetch skill to get duration
        const skill = await Skill.findById(skillId);
        if (!skill) return res.status(404).json({ error: 'Skill not found' });

        // Create booking in pending_payment status
        const newBooking = new Booking({
            studentId,
            providerId,
            skillId,
            date: new Date(date),
            duration: skill.duration || 60, // Snapshot duration from skill
            note,
            status: 'pending_payment', // Will change to 'requested' after payment
            paymentStatus: 'pending'
        });

        const savedBooking = await newBooking.save();

        // Return booking with skill info for payment
        const populatedBooking = await Booking.findById(savedBooking._id).populate('skillId');

        res.status(201).json(populatedBooking);
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

        // Get escrow info if exists
        let escrow = null;
        if (booking.escrowId) {
            escrow = await Escrow.findById(booking.escrowId);
        }

        res.json({ ...booking.toObject(), student, provider, escrow });
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
            // Provider should only see bookings that have been paid (not pending_payment)
            query.status = { $ne: 'pending_payment' };
        } else {
            query.studentId = userId;
        }

        const bookings = await Booking.find(query)
            .populate('skillId')
            .sort({ createdAt: -1 });

        // Enrich with other user's details and escrow info
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            const otherUserId = role === 'provider' ? booking.studentId : booking.providerId;
            const otherUser = await User.findOne({ clerkId: otherUserId }, 'firstName lastName imageUrl email');

            let escrow = null;
            if (booking.escrowId) {
                escrow = await Escrow.findById(booking.escrowId);
            }

            // Check if review exists for this booking
            const hasReviewed = await Review.exists({ bookingId: booking._id });

            return { ...booking.toObject(), otherUser, escrow, hasReviewed: !!hasReviewed };
        }));

        res.json(enrichedBookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH Update Status (Approve/Reject/Complete/Cancel)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['requested', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const booking = await Booking.findById(req.params.id).populate('skillId');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const updateData = { status };

        // Generate meeting link if approved
        if (status === 'approved') {
            updateData.meetingLink = `/meeting/${req.params.id}`;
        }

        // Handle rejection - refund escrow
        if (status === 'rejected' && booking.paymentStatus === 'paid') {
            // Trigger refund via separate endpoint or handle here
            // For now, we'll mark it and the frontend will call refund-escrow
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('skillId');

        // Create Notifications based on Status Change
        if (status === 'approved') {
            // Notify Student
            await Notification.create({
                userId: booking.studentId,
                type: 'booking',
                title: 'Booking Approved! 🎉',
                message: `Your session for "${booking.skillId.title}" has been approved. Join the meeting at the scheduled time.`,
                link: `/chat?booking=${booking._id}`
            });

            // Notify Provider
            await Notification.create({
                userId: booking.providerId,
                type: 'booking',
                title: 'Session Confirmed ✅',
                message: `You accepted the booking for "${booking.skillId.title}". The meeting link is ready.`,
                link: `/chat?booking=${booking._id}`
            });
        } else if (status === 'rejected') {
            await Notification.create({
                userId: booking.studentId,
                type: 'booking',
                title: 'Booking Declined',
                message: `Your booking for "${booking.skillId.title}" was declined. Your payment will be refunded.`,
                link: '/bookings'
            });
        } else if (status === 'completed') {
            await Notification.create({
                userId: booking.providerId,
                type: 'system',
                title: 'Session Completed',
                message: `Session for "${booking.skillId.title}" marked as completed.`,
                link: '/wallet'
            });
        } else if (status === 'cancelled') {
            // Notify the other party about cancellation
            const notifyUserId = booking.studentId === req.body.cancelledBy
                ? booking.providerId
                : booking.studentId;

            await Notification.create({
                userId: notifyUserId,
                type: 'booking',
                title: 'Booking Cancelled',
                message: `The booking for "${booking.skillId.title}" has been cancelled.`,
                link: '/bookings'
            });
        }

        res.json(updatedBooking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE Cancel pending payment booking
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Only allow deletion if status is pending_payment
        if (booking.status !== 'pending_payment') {
            return res.status(400).json({ error: 'Cannot delete booking after payment' });
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Booking cancelled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH Mark Attendance (Joined Meeting)
router.patch('/:id/attendance', async (req, res) => {
    try {
        const { role } = req.body;
        const updateData = {};

        if (role === 'provider') updateData.providerJoined = true;
        if (role === 'student') updateData.studentJoined = true;

        // Set joinedAt if not already set (first joiner)
        const booking = await Booking.findById(req.params.id);
        if (booking && !booking.joinedAt) updateData.joinedAt = new Date();

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(updatedBooking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH Update Session Duration (Heartbeat every minute)
router.patch('/:id/heartbeat', async (req, res) => {
    try {
        const { role, durationIncr = 1 } = req.body; // default increment 1 minute
        if (!['student', 'provider'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const updateField = role === 'provider' ? 'providerOnlineMinutes' : 'studentOnlineMinutes';

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $inc: { [updateField]: durationIncr } },
            { new: true }
        );
        res.json({ success: true, [updateField]: booking[updateField] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
