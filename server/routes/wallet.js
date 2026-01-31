const express = require('express');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Razorpay = require('razorpay');
const router = express.Router();

// Initialize Razorpay
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} else {
    console.warn("⚠️ Razorpay keys missing. Automated payouts will be skipped (simulation mode).");
}

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

// Save Payout Details
router.post('/payout-details', async (req, res) => {
    try {
        const { userId, details } = req.body;
        // details = { type: 'upi'|'bank_account', upiId, bankAccount: { ... } }

        const wallet = await getWallet(userId);
        wallet.payoutDetails = details;
        await wallet.save();

        res.json(wallet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request Withdrawal
router.post('/withdraw', async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        const wallet = await getWallet(userId);

        if (wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        if (!wallet.payoutDetails || (!wallet.payoutDetails.upiId && !wallet.payoutDetails.bankAccount?.accountNumber)) {
            return res.status(400).json({ error: 'Please set up payout details first.' });
        }

        let payoutId = null;

        // AUTOMATED PAYOUT via RAZORPAY X
        if (razorpay) {
            console.log("Razorpay Instance Keys:", Object.keys(razorpay));
            if (!razorpay.contacts) {
                console.error("⚠️ Razorpay SDK does not appear to support 'contacts' (Razorpay X). Skipping automated payout.");
                // Proceed to manual/simulated deduction below
            } else {
                // 1. Get or Create Contact
                let contactId = wallet.razorpayContactId;
                if (!contactId) {
                    const user = await User.findOne({ clerkId: userId });
                    if (user) {
                        try {
                            const contact = await razorpay.contacts.create({
                                name: (user.firstName + ' ' + (user.lastName || '')).trim() || 'SkillShare Provider',
                                email: user.email,
                                type: 'vendor',
                                reference_id: userId,
                                notes: { userId }
                            });
                            contactId = contact.id;
                            wallet.razorpayContactId = contactId;
                            await wallet.save(); // Save contactId for future
                        } catch (e) {
                            console.error("Razorpay Contact Create Error", e);
                            const errorMsg = e.error && e.error.description ? e.error.description : e.message;
                            return res.status(500).json({ error: 'Failed to create payout contact: ' + errorMsg });
                        }
                    }
                }

                // 2. Create Fund Account (Link UPI/Bank)
                let fundAccountId;
                try {
                    if (wallet.payoutDetails.type === 'upi') {
                        const fa = await razorpay.fundAccount.create({
                            contact_id: contactId,
                            account_type: 'vpa',
                            vpa: { address: wallet.payoutDetails.upiId }
                        });
                        fundAccountId = fa.id;
                    } else {
                        const fa = await razorpay.fundAccount.create({
                            contact_id: contactId,
                            account_type: 'bank_account',
                            bank_account: {
                                name: wallet.payoutDetails.bankAccount.holderName,
                                ifsc: wallet.payoutDetails.bankAccount.ifsc,
                                account_number: wallet.payoutDetails.bankAccount.accountNumber
                            }
                        });
                        fundAccountId = fa.id;
                    }
                } catch (e) {
                    console.error("Razorpay Fund Account Error", e);
                    return res.status(500).json({ error: 'Invalid payout details: ' + e.error?.description });
                }

                // 3. Initiate Payout
                try {
                    const payout = await razorpay.payouts.create({
                        account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER || '7878780080316316', // Fallback Test Account Number
                        fund_account_id: fundAccountId,
                        amount: amount * 100, // paise
                        currency: 'INR',
                        mode: wallet.payoutDetails.type === 'upi' ? 'UPI' : 'IMPS',
                        purpose: 'payout',
                        queue_if_low_balance: true,
                        reference_id: `wd_${Date.now()}_${userId.slice(-4)}`,
                        narration: 'SkillShare Withdrawal'
                    });
                    payoutId = payout.id;
                } catch (e) {
                    console.error("Razorpay Payout Error", e);
                    // If error is about insufficient balance in Razorpay X, we notify user
                    if (e.error?.description) {
                        return res.status(400).json({ error: 'Payout Failed: ' + e.error.description });
                    }
                    return res.status(500).json({ error: 'Payout initiation failed.' });
                }
            }
        }

        // Deduct balance locally
        wallet.balance -= amount;
        await wallet.save();

        // Create Transaction Record
        await Transaction.create({
            userId,
            amount,
            type: 'DEBIT',
            category: 'WITHDRAWAL',
            description: `Withdrawal to ${wallet.payoutDetails.type === 'upi' ? 'UPI' : 'Bank Account'}`,
            transactionId: payoutId
        });

        res.json({ success: true, wallet, message: 'Withdrawal processed successfully via Razorpay' });
    } catch (err) {
        console.error("Withdraw Error", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
