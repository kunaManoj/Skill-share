const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Clerk ID
    balance: { type: Number, default: 0 },
    frozenBalance: { type: Number, default: 0 }, // Escrowed funds
    currency: { type: String, default: 'INR' },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wallet', walletSchema);
