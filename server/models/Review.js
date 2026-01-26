const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewerId: { type: String, required: true }, // Clerk ID (Student)
    providerId: { type: String, required: true }, // Clerk ID (Provider)
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
