const Booking = require('../models/Booking');
const Escrow = require('../models/Escrow');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const User = require('../models/User');

const checkExpiredBookings = async () => {
    try {
        const now = new Date();
        // Find bookings that are 'requested' (paid but not approved) and start time has passed
        const expiredBookings = await Booking.find({
            status: 'requested',
            date: { $lt: now }
        }).populate('skillId');

        if (expiredBookings.length === 0) return;

        console.log(`Found ${expiredBookings.length} expired bookings to process.`);

        for (const booking of expiredBookings) {
            console.log(`Processing expired booking: ${booking._id}`);

            // Find held escrow
            const escrow = await Escrow.findOne({ bookingId: booking._id, status: 'held' });
            if (!escrow) {
                console.error(`No held escrow found for booking ${booking._id}`);
                continue;
            }

            // 1. Refund to student wallet
            let studentWallet = await Wallet.findOne({ userId: booking.studentId });
            if (!studentWallet) {
                studentWallet = new Wallet({ userId: booking.studentId });
            }
            studentWallet.balance += escrow.amount;
            await studentWallet.save();

            // 2. Update Escrow
            escrow.status = 'refunded';
            escrow.refundedAt = now;
            escrow.refundReason = 'Provider failed to approve before start time';
            await escrow.save();

            // 3. Update Booking
            booking.status = 'cancelled';
            booking.paymentStatus = 'refunded';
            booking.note = (booking.note || '') + ' [System: Cancelled due to provider inaction]';
            await booking.save();

            // 4. Record Transaction for Refund
            await Transaction.create({
                userId: booking.studentId,
                amount: escrow.amount,
                type: 'CREDIT',
                category: 'REFUND',
                description: `Refund: Provider didn't approve request for "${booking.skillId.title}" in time`,
                relatedBookingId: booking._id
            });

            // 5. Notify Student
            await Notification.create({
                userId: booking.studentId,
                type: 'payment',
                title: 'Booking Expired & Refunded',
                message: `Your booking request for "${booking.skillId.title}" expired because the provider didn't approve it in time. ₹${escrow.amount} has been refunded to your wallet.`,
                link: '/wallet'
            });

            // 6. Notify Provider
            await Notification.create({
                userId: booking.providerId,
                type: 'system',
                title: 'Missed Booking Request',
                message: `You missed a booking request for "${booking.skillId.title}" scheduled for ${booking.date.toLocaleString()}. The request has been cancelled and the student refunded.`,
                link: '/bookings'
            });
        }
    } catch (error) {
        console.error('Error in checkExpiredBookings job:', error);
    }
};

module.exports = checkExpiredBookings;
