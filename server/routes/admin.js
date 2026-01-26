const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Skill = require('../models/Skill');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

// Middleware to check Admin Role
const isAdmin = async (req, res, next) => {
    const adminId = req.headers['x-admin-id'];
    if (!adminId) return res.status(401).json({ error: 'Unauthorized: No Admin ID provided' });

    try {
        const user = await User.findOne({ clerkId: adminId });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admins only' });
        }
        req.admin = user;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Apply Middleware
router.use(isAdmin);

// GET /admin/stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalSkills = await Skill.countDocuments();
        const totalBookings = await Booking.countDocuments();

        // Calculate total volume safely
        const transactions = await Transaction.find({ type: 'payment' }); // Assuming payment type relates to volume
        // If Transaction model doesn't have amounts easily summable, or we use Booking price.
        // Let's use bookings completed * price for now or just wait for Transaction schema check.
        // For MVP, just count.

        res.json({
            totalUsers,
            totalSkills,
            totalBookings,
            // totalVolume
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /admin/users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /admin/users/:id/ban
router.post('/users/:id/ban', async (req, res) => {
    try {
        const { isBanned } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.isBanned = isBanned;
        await user.save();
        res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /admin/skills
router.get('/skills', async (req, res) => {
    try {
        const skills = await Skill.find().sort({ createdAt: -1 });
        // Enrich with provider name for display
        const enrichedSkills = await Promise.all(skills.map(async (skill) => {
            const provider = await User.findOne({ clerkId: skill.providerId }).select('firstName lastName email');
            return { ...skill.toObject(), provider };
        }));
        res.json(enrichedSkills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /admin/skills/:id
router.delete('/skills/:id', async (req, res) => {
    try {
        await Skill.findByIdAndDelete(req.params.id);
        res.json({ message: 'Skill deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /admin/bookings
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 }).limit(50);
        // Enrich
        const enrichedBookings = await Promise.all(bookings.map(async (b) => {
            const student = await User.findOne({ clerkId: b.studentId }).select('firstName lastName');
            const provider = await User.findOne({ clerkId: b.providerId }).select('firstName lastName');
            const skill = await Skill.findById(b.skillId).select('title');
            return {
                ...b.toObject(),
                studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
                providerName: provider ? `${provider.firstName} ${provider.lastName}` : 'Unknown',
                skillTitle: skill ? skill.title : 'Deleted Skill'
            };
        }));
        res.json(enrichedBookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
