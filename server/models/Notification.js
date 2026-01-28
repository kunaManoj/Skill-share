const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Clerk ID of recipient
    type: { type: String, enum: ['booking', 'payment', 'system', 'reminder'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // Optional link to navigate to (e.g., /bookings)
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
