const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    providerId: { type: String, required: true }, // Clerk ID of the provider
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['Academic', 'Programming', 'Music', 'Language', 'Art', 'Other']
    },
    price: { type: Number, required: true }, // Price per hour
    image: { type: String }, // URL to cover image
    experience: { type: String }, // e.g., "Intermediate", "Expert"
    language: { type: String },
    duration: { type: Number, default: 60 }, // Duration in minutes
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Skill', skillSchema);
