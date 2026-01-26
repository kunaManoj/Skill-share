const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    studentId: { type: String, required: true }, // Clerk ID of student
    providerId: { type: String, required: true }, // Clerk ID of provider
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },

    status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'requested'
    },

    date: { type: Date, required: true }, // Proposed session time
    duration: { type: Number, default: 60 }, // in minutes
    note: { type: String }, // Message from student
    meetingLink: { type: String }, // Video call link

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
