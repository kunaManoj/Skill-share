const express = require('express');
const Skill = require('../models/Skill');
const User = require('../models/User');

const router = express.Router();

// GET all skills (with filters)
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skills = await Skill.find(query).sort({ createdAt: -1 });

        // Enrich with provider info (optional, better with aggregate but this works for MVP)
        const enrichedSkills = await Promise.all(skills.map(async (skill) => {
            const provider = await User.findOne({ clerkId: skill.providerId });
            return { ...skill.toObject(), provider };
        }));

        res.json(enrichedSkills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single skill
router.get('/:id', async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) return res.status(404).json({ error: 'Skill not found' });

        const provider = await User.findOne({ clerkId: skill.providerId });
        res.json({ ...skill.toObject(), provider });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create skill
router.post('/', async (req, res) => { // Auth middleware needed here later
    try {
        const { providerId, title, description, category, price, experience } = req.body;

        const newSkill = new Skill({
            providerId,
            title,
            description,
            category,
            price,
            experience
        });

        const savedSkill = await newSkill.save();

        // Add logic to update User's skills array if needed

        res.status(201).json(savedSkill);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE skill
router.delete('/:id', async (req, res) => {
    try {
        const { userId } = req.body; // In real app, get from auth middleware
        const skill = await Skill.findById(req.params.id);

        if (!skill) return res.status(404).json({ error: 'Skill not found' });

        // Check ownership
        if (skill.providerId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Skill.findByIdAndDelete(req.params.id);
        res.json({ message: 'Skill deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
