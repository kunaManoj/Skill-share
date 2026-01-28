const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

// Initialize Razorpay
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} else {
    console.warn("⚠️ Razorpay keys missing. Payment routes will fail.");
}

// Create Order
router.post('/create-order', async (req, res) => {
    if (!razorpay) return res.status(500).json({ error: 'Payment gateway not configured' });
    try {
        const { amount, currency = 'INR' } = req.body;

        const options = {
            amount: amount * 100, // Razorpay works in paise (1 INR = 100 paise)
            currency,
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify Payment and Release Funds
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
            amount
        } = req.body;

        // 1. Verify Signature
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // 2. Payment Successful - Process Settlement
        const booking = await Booking.findById(bookingId).populate('skillId');
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Update Booking Status
        booking.status = 'completed';
        booking.paymentStatus = 'paid'; // Assuming schema support or just relying on status
        await booking.save();

        // 3. Add Funds to Provider Wallet
        let providerWallet = await Wallet.findOne({ userId: booking.providerId });
        if (!providerWallet) {
            providerWallet = new Wallet({ userId: booking.providerId });
        }

        providerWallet.balance += amount; // Amount is already in main currency units from client
        await providerWallet.save();

        // 4. Record Transaction
        await Transaction.create({
            userId: booking.providerId,
            amount: amount,
            type: 'CREDIT',
            category: 'EARNING',
            description: `Payment received for booking ${bookingId}`,
            relatedBookingId: bookingId,
            transactionId: razorpay_payment_id // Store external ID
        });

        res.json({ success: true, message: 'Payment verified and funds released' });

    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
