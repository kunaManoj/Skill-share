const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    category: { type: String, enum: ['DEPOSIT', 'PAYMENT', 'REFUND', 'EARNING', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'WITHDRAWAL'], required: true },
    description: { type: String },
    relatedBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    transactionId: { type: String }, // External transaction ID (e.g., Razorpay payment ID)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
