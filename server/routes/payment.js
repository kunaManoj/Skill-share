const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Escrow = require('../models/Escrow');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');
const Skill = require('../models/Skill');

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

// ==========================================
// ESCROW PAYMENT FLOW
// ==========================================

// Step 1: Create order for escrow payment (at booking time)
router.post('/create-escrow-order', async (req, res) => {
    if (!razorpay) return res.status(500).json({ error: 'Payment gateway not configured' });

    try {
        const { amount, bookingId, currency = 'INR' } = req.body;

        // Validate booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if escrow already exists
        const existingEscrow = await Escrow.findOne({ bookingId });
        if (existingEscrow && existingEscrow.status === 'held') {
            return res.status(400).json({ error: 'Payment already made for this booking' });
        }

        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency,
            receipt: `e_${bookingId}_${Date.now().toString().slice(-4)}`
        };

        const order = await razorpay.orders.create(options);
        res.json({ ...order, bookingId });
    } catch (error) {
        console.error('Escrow Order Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Step 2: Verify escrow payment and hold funds
router.post('/verify-escrow-payment', async (req, res) => {
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

        // 2. Get booking details
        const booking = await Booking.findById(bookingId).populate('skillId');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // 3. Create Escrow record (funds are held)
        const escrow = await Escrow.create({
            bookingId: booking._id,
            studentId: booking.studentId,
            providerId: booking.providerId,
            amount: amount,
            status: 'held',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id
        });

        // 4. Update Booking - move to 'requested' status (payment done, awaiting provider approval)
        booking.status = 'requested';
        booking.paymentStatus = 'paid';
        booking.escrowId = escrow._id;
        await booking.save();

        // 5. Record Transaction (student paid)
        await Transaction.create({
            userId: booking.studentId,
            amount: amount,
            type: 'DEBIT',
            category: 'ESCROW_HOLD',
            description: `Payment held in escrow for "${booking.skillId.title}"`,
            relatedBookingId: bookingId,
            transactionId: razorpay_payment_id
        });

        // 6. Notify Provider of new booking request
        await Notification.create({
            userId: booking.providerId,
            type: 'booking',
            title: 'New Paid Booking Request!',
            message: `You have a new booking request for "${booking.skillId.title}". Payment of ₹${amount} is secured in escrow.`,
            link: '/bookings'
        });

        // 7. Notify Student of confirmation
        await Notification.create({
            userId: booking.studentId,
            type: 'payment',
            title: 'Payment Secured',
            message: `Your payment of ₹${amount} for "${booking.skillId.title}" is secured. Waiting for provider approval.`,
            link: '/bookings'
        });

        res.json({
            success: true,
            message: 'Payment secured in escrow. Booking request sent to provider.',
            booking: booking
        });

    } catch (error) {
        console.error('Escrow Payment Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Step 3: Release escrow funds to provider (after session completion)
router.post('/release-escrow', async (req, res) => {
    try {
        const { bookingId } = req.body;

        // 1. Find booking and escrow
        const booking = await Booking.findById(bookingId).populate('skillId');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const escrow = await Escrow.findOne({ bookingId, status: 'held' });
        if (!escrow) {
            return res.status(400).json({ error: 'No held escrow found for this booking' });
        }

        // 2. Release funds to provider wallet
        let providerWallet = await Wallet.findOne({ userId: booking.providerId });
        if (!providerWallet) {
            providerWallet = new Wallet({ userId: booking.providerId });
        }
        providerWallet.balance += escrow.amount;
        await providerWallet.save();

        // 3. Update escrow status
        escrow.status = 'released';
        escrow.releasedAt = new Date();
        await escrow.save();

        // 4. Update booking
        booking.status = 'completed';
        booking.paymentStatus = 'released';
        await booking.save();

        // 5. Record Transaction (provider received)
        await Transaction.create({
            userId: booking.providerId,
            amount: escrow.amount,
            type: 'CREDIT',
            category: 'ESCROW_RELEASE',
            description: `Payment released for "${booking.skillId.title}"`,
            relatedBookingId: bookingId,
            transactionId: escrow.razorpayPaymentId
        });

        // 6. Notify both parties
        await Notification.create({
            userId: booking.providerId,
            type: 'payment',
            title: 'Payment Received!',
            message: `₹${escrow.amount} has been added to your wallet for "${booking.skillId.title}".`,
            link: '/wallet'
        });

        await Notification.create({
            userId: booking.studentId,
            type: 'system',
            title: 'Payment Released',
            message: `Your payment for "${booking.skillId.title}" has been released to the provider. Session completed.`,
            link: '/bookings'
        });

        res.json({
            success: true,
            message: 'Escrow released to provider',
            amount: escrow.amount
        });

    } catch (error) {
        console.error('Release Escrow Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Step 4: Refund escrow to student (if provider rejects or cancels)
router.post('/refund-escrow', async (req, res) => {
    try {
        const { bookingId, reason } = req.body;

        // 1. Find booking and escrow
        const booking = await Booking.findById(bookingId).populate('skillId');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const escrow = await Escrow.findOne({ bookingId, status: 'held' });
        if (!escrow) {
            return res.status(400).json({ error: 'No held escrow found for this booking' });
        }

        // 2. Refund to student wallet (or initiate Razorpay refund)
        // For simplicity, we'll add to wallet. In production, you'd use razorpay.payments.refund()
        let studentWallet = await Wallet.findOne({ userId: booking.studentId });
        if (!studentWallet) {
            studentWallet = new Wallet({ userId: booking.studentId });
        }
        studentWallet.balance += escrow.amount;
        await studentWallet.save();

        // 3. Update escrow status
        escrow.status = 'refunded';
        escrow.refundedAt = new Date();
        escrow.refundReason = reason || 'Booking cancelled/rejected';
        await escrow.save();

        // 4. Update booking
        booking.paymentStatus = 'refunded';
        await booking.save();

        // 5. Record Transaction
        await Transaction.create({
            userId: booking.studentId,
            amount: escrow.amount,
            type: 'CREDIT',
            category: 'REFUND',
            description: `Refund for "${booking.skillId.title}" - ${reason || 'Booking cancelled'}`,
            relatedBookingId: bookingId
        });

        // 6. Notify student
        await Notification.create({
            userId: booking.studentId,
            type: 'payment',
            title: 'Refund Processed',
            message: `₹${escrow.amount} has been refunded to your wallet for "${booking.skillId.title}".`,
            link: '/wallet'
        });



        res.json({
            success: true,
            message: 'Escrow refunded to student',
            amount: escrow.amount
        });

    } catch (error) {
        console.error('Refund Escrow Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Student: Claim refund for Provider No-Show
router.post('/claim-no-show-refund', async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId).populate('skillId');

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Validation Checks
        if (booking.status !== 'approved' || booking.paymentStatus !== 'paid') {
            return res.status(400).json({ error: 'Booking not eligible for refund' });
        }

        const duration = booking.duration || 60;
        const requiredTime = duration * 0.7;
        const providerOnline = booking.providerOnlineMinutes || 0;

        if (providerOnline >= requiredTime) {
            return res.status(400).json({ error: 'Provider met attendance requirements. Cannot claim refund.' });
        }

        const now = new Date();
        const endTime = new Date(booking.date.getTime() + (booking.duration || 60) * 60000);

        if (now <= endTime) {
            return res.status(400).json({ error: 'Session time has not ended yet.' });
        }

        // Process Refund
        const escrow = await Escrow.findOne({ bookingId: booking._id, status: 'held' });
        if (!escrow) return res.status(400).json({ error: 'No escrow funds found.' });

        // 1. Refund to student wallet
        let studentWallet = await Wallet.findOne({ userId: booking.studentId });
        if (!studentWallet) studentWallet = new Wallet({ userId: booking.studentId });

        studentWallet.balance += escrow.amount;
        await studentWallet.save();

        // 2. Update escrow
        escrow.status = 'refunded';
        escrow.refundedAt = now;
        escrow.refundReason = 'Provider No-Show (Student Claimed)';
        await escrow.save();

        // 3. Update booking
        booking.status = 'cancelled';
        booking.paymentStatus = 'refunded';
        booking.note = (booking.note || '') + ' [Student claimed no-show refund]';
        await booking.save();

        // 4. Transaction record
        await Transaction.create({
            userId: booking.studentId,
            amount: escrow.amount,
            type: 'CREDIT',
            category: 'REFUND',
            description: `Refund Claim: Provider missed session "${booking.skillId.title}"`,
            relatedBookingId: booking._id
        });



        // 6. Notify Student
        await Notification.create({
            userId: booking.studentId,
            type: 'payment',
            title: 'Refund Processed',
            message: `Refund of ₹${escrow.amount} for "${booking.skillId.title}" has been added to your wallet.`,
            link: '/wallet'
        });

        res.json({ success: true, message: 'Refund processed successfully' });

    } catch (error) {
        console.error('Claim Refund Error:', error);
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
