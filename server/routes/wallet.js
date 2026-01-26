const express = require('express');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Helper to get or create wallet
const getWallet = async (userId) => {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
        wallet = new Wallet({ userId });
        await wallet.save();
    }
    return wallet;
};

// GET Wallet Balance & History
router.get('/:userId', async (req, res) => {
    try {
        const wallet = await getWallet(req.params.userId);
        const transactions = await Transaction.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json({ wallet, transactions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Add Funds (Mock Test Payment)
router.post('/add-funds', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        const wallet = await getWallet(userId);
        wallet.balance += amount;
        await wallet.save();

        await Transaction.create({
            userId,
            amount,
            type: 'CREDIT',
            category: 'DEPOSIT',
            description: 'Added funds to wallet'
        });

        res.json(wallet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Internal function to process payment (Escrow)
router.post('/pay-escrow', async (req, res) => {
    try {
        const { userId, amount, bookingId } = req.body;
        const wallet = await getWallet(userId);

        if (wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        wallet.balance -= amount;
        wallet.frozenBalance += amount;
        await wallet.save();

        await Transaction.create({
            userId,
            amount,
            type: 'DEBIT',
            category: 'PAYMENT',
            description: 'Payment held in escrow for booking',
            relatedBookingId: bookingId
        });

        res.json({ success: true, wallet });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Internal function to release funds (Completion)
router.post('/release-escrow', async (req, res) => {
    try {
        const { studentId, providerId, amount, bookingId } = req.body;

        // 1. Deduct from Student's Frozen Balance
        const studentWallet = await getWallet(studentId);
        if (studentWallet.frozenBalance >= amount) {
            studentWallet.frozenBalance -= amount;
            await studentWallet.save();
        }

        // 2. Add to Provider's Balance
        const providerWallet = await getWallet(providerId);
        providerWallet.balance += amount;
        await providerWallet.save();

        // 3. Log Transactions
        await Transaction.create({
            userId: providerId,
            amount,
            type: 'CREDIT',
            category: 'EARNING',
            description: 'Payment released for completed session',
            relatedBookingId: bookingId
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
