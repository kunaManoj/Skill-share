const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true
    },
    studentId: { type: String, required: true }, // Clerk ID of student (payer)
    providerId: { type: String, required: true }, // Clerk ID of provider (recipient)
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    status: {
        type: String,
        enum: ['held', 'released', 'refunded', 'disputed'],
        default: 'held'
    },

    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    releasedAt: { type: Date },
    refundedAt: { type: Date },
    refundReason: { type: String },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Escrow', escrowSchema);
