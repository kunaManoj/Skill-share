const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    imageUrl: { type: String },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    bio: { type: String, default: '' },
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    walletBalance: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
