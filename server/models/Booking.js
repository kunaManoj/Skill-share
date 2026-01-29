const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    studentId: { type: String, required: true }, // Clerk ID of student
    providerId: { type: String, required: true }, // Clerk ID of provider
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },

    status: {
        type: String,
        enum: ['pending_payment', 'requested', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'pending_payment' // Changed default - booking starts with payment
    },

    // Payment tracking for escrow system
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'released', 'refunded'],
        default: 'pending'
    },
    escrowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Escrow' },

    date: { type: Date, required: true }, // Proposed session time
    duration: { type: Number, default: 60 }, // in minutes
    note: { type: String }, // Message from student
    meetingLink: { type: String }, // Video call link

    providerJoined: { type: Boolean, default: false },
    studentJoined: { type: Boolean, default: false },
    joinedAt: { type: Date },
    providerOnlineMinutes: { type: Number, default: 0 },
    studentOnlineMinutes: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
