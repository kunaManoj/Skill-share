require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: true, // Allow any origin in dev (or array of allowed)
    credentials: true
}));

const webhookRoutes = require('./routes/webhooks');
const skillRoutes = require('./routes/skills');
const bookingRoutes = require('./routes/bookings');
const walletRoutes = require('./routes/wallet');
const chatRoutes = require('./routes/chat');

app.use('/api/webhooks', webhookRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dev', require('./routes/dev'));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'UniRent API' });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Socket.io Setup
const { Server } = require('socket.io');
const Message = require('./models/Message');

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (bookingId) => {
        socket.join(bookingId);
        console.log(`User joined room: ${bookingId}`);
    });

    socket.on('send_message', async (data) => {
        // data: { bookingId, senderId, text }
        const { bookingId, senderId, text } = data;

        // Save to DB
        const newMessage = new Message({ bookingId, senderId, text });
        await newMessage.save();

        // Broadcast to room
        io.to(bookingId).emit('receive_message', newMessage);
    });

    // WebRTC Signaling
    socket.on('call_user', ({ userToCall, signalData, from }) => {
        io.to(userToCall).emit('call_user', { signal: signalData, from });
    });

    socket.on('answer_call', (data) => {
        io.to(data.to).emit('call_accepted', data.signal);
    });

    socket.on('join_video_room', (bookingId) => {
        socket.join(bookingId);
        // Notify others in room that a user connected (simple implementation for 2 people)
        socket.to(bookingId).emit('user_joined_video', socket.id);
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
        io.to(to).emit('ice_candidate', { candidate, from: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
