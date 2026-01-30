const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');

// POST /reviews - Create a new review
router.post('/', async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;

        // Verify booking exists and is completed
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.status !== 'completed') {
            // If booking is not completed, update its status to completed
            await Booking.findByIdAndUpdate(bookingId, { status: 'completed' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) return res.status(400).json({ error: 'Review already exists for this booking' });

        // Create review
        const review = new Review({
            reviewerId: booking.studentId,
            providerId: booking.providerId,
            skillId: booking.skillId,
            bookingId,
            rating,
            comment
        });
        await review.save();

        // Update Provider Stats
        const provider = await User.findOne({ clerkId: booking.providerId });
        if (provider) {
            const reviews = await Review.find({ providerId: booking.providerId });
            const total = reviews.length;
            const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / total;

            provider.averageRating = avg.toFixed(1);
            provider.totalReviews = total;
            // Trust Score Algorithm: (Avg * 10) + (Reviews * 2). Max 100.
            provider.trustScore = Math.min(100, Math.round((avg * 10) + (total * 2)));

            await provider.save();
        }

        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /reviews/skill/:skillId
router.get('/skill/:skillId', async (req, res) => {
    try {
        const reviews = await Review.find({ skillId: req.params.skillId }).sort({ createdAt: -1 });

        // Manual lookup for reviewers details
        const reviewers = await User.find({ clerkId: { $in: reviews.map(r => r.reviewerId) } }).select('firstName lastName imageUrl clerkId');
        const reviewerMap = reviewers.reduce((acc, user) => {
            acc[user.clerkId] = user;
            return acc;
        }, {});

        const enrichedReviews = reviews.map(r => ({
            ...r.toObject(),
            reviewerName: reviewerMap[r.reviewerId] ? `${reviewerMap[r.reviewerId].firstName} ${reviewerMap[r.reviewerId].lastName}` : 'Unknown',
            reviewerImage: reviewerMap[r.reviewerId]?.imageUrl
        }));

        res.json(enrichedReviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /reviews/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ providerId: req.params.userId }).sort({ createdAt: -1 });

        const reviewers = await User.find({ clerkId: { $in: reviews.map(r => r.reviewerId) } }).select('firstName lastName imageUrl clerkId');
        const reviewerMap = reviewers.reduce((acc, user) => {
            acc[user.clerkId] = user;
            return acc;
        }, {});

        const enrichedReviews = reviews.map(r => ({
            ...r.toObject(),
            reviewerName: reviewerMap[r.reviewerId] ? `${reviewerMap[r.reviewerId].firstName} ${reviewerMap[r.reviewerId].lastName}` : 'Unknown',
            reviewerImage: reviewerMap[r.reviewerId]?.imageUrl
        }));

        res.json(enrichedReviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
