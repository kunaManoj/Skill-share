const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Clerk ID
    balance: { type: Number, default: 0 },
    frozenBalance: { type: Number, default: 0 }, // Escrowed funds
    payoutDetails: {
        type: { type: String, enum: ['upi', 'bank_account'], default: 'upi' },
        upiId: { type: String },
        bankAccount: {
            accountNumber: { type: String },
            ifsc: { type: String },
            holderName: { type: String }
        }
    },
    razorpayContactId: { type: String },
    currency: { type: String, default: 'INR' },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wallet', walletSchema);
