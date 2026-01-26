import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getMessages, getBooking, updateBookingStatus, releaseFunds } from '../lib/api';
import { Send, CheckCircle, ChevronLeft, User, ShieldCheck, Zap } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import ReviewModal from '../components/ReviewModal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ChatPage() {
    const { user } = useUser();
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('booking');

    const [booking, setBooking] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState<any>(null);
    const [completing, setCompleting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    useEffect(() => {
        if (user && bookingId) {
            const newSocket = io(SOCKET_URL);
            setSocket(newSocket);
            newSocket.emit('join_room', bookingId);

            getBooking(bookingId).then(setBooking).catch(console.error);
            getMessages(bookingId).then(setMessages).catch(console.error);

            newSocket.on('receive_message', (message: any) => {
                setMessages((prev) => [...prev, message]);
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user, bookingId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!socket || !newMessage.trim() || !user || !bookingId) return;

        const messageData = {
            bookingId,
            senderId: user.id,
            text: newMessage,
        };

        await socket.emit('send_message', messageData);
        setNewMessage('');
    };

    const handleCompleteSession = async () => {
        if (!user || !booking) return;
        if (!confirm('Are you sure you want to complete this session and release funds?')) return;

        setCompleting(true);
        try {
            await updateBookingStatus(booking._id, 'completed');
            await releaseFunds({
                studentId: booking.studentId,
                providerId: booking.providerId,
                amount: booking.skillId.price,
                bookingId: booking._id
            });

            setBooking((prev: any) => ({ ...prev, status: 'completed' }));
            if (user.id === booking.studentId) {
                setShowReviewModal(true);
            } else {
                toast.success('Session completed successfully!');
            }
        } catch (error) {
            console.error('Completion failed:', error);
            toast.error('Failed to complete session.');
        } finally {
            setCompleting(false);
        }
    };

    if (!bookingId) return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8 text-center space-y-4">
            <Zap size={48} className="text-gray-200" />
            <h2 className="text-xl font-bold text-gray-900">Start a Conversation</h2>
            <p className="text-gray-500 max-w-xs">Select a booking from your dashboard to begin chatting with your peer.</p>
            <Link to="/bookings" className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold">My Bookings</Link>
        </div>
    );

    const otherUser = user?.id === booking?.studentId ? booking?.provider : booking?.student;

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-64px)] flex flex-col">
            {/* Header controls */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 mb-4 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-4">
                        <Link to="/bookings" className="p-2 hover:bg-gray-50:bg-gray-800 rounded-full transition-colors text-gray-400">
                            <ChevronLeft size={24} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 font-black text-xl">
                                {otherUser?.firstName?.[0] || <User size={24} />}
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 leading-tight">
                                    {otherUser?.firstName} {otherUser?.lastName}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={clsx("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border",
                                        booking?.status === 'completed' ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    )}>
                                        {booking?.status}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{booking?.skillId?.title}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {booking?.status === 'completed' ? (
                            <div className="flex items-center gap-2 text-sky-600 bg-sky-50 px-5 py-2.5 rounded-2xl border border-sky-100 text-sm font-bold">
                                <CheckCircle size={18} />
                                Session Completed
                            </div>
                        ) : (
                            <button
                                onClick={handleCompleteSession}
                                disabled={completing}
                                className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-2xl text-sm font-black transition-all shadow-xl shadow-gray-900/10 active:scale-95 disabled:opacity-50"
                            >
                                {completing ? 'Closing...' : 'Complete Session'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat contentArea */}
            <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-gray-100 overflow-hidden flex flex-col shadow-inner">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <motion.div
                                    key={msg._id || idx}
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className={clsx("flex", isMe ? "justify-end" : "justify-start")}
                                >
                                    <div className={clsx(
                                        "max-w-[80%] md:max-w-[60%] flex flex-col",
                                        isMe ? "items-end" : "items-start"
                                    )}>
                                        <div className={clsx(
                                            "rounded-[1.5rem] px-5 py-3 shadow-sm text-sm font-medium leading-relaxed transition-colors",
                                            isMe
                                                ? "bg-primary-600 text-white rounded-br-none"
                                                : "bg-white text-gray-900 border border-gray-50 rounded-bl-none"
                                        )}>
                                            <p>{msg.text}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 px-1">
                                            {format(new Date(msg.createdAt || Date.now()), 'p')}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={scrollRef} />
                </div>

                {/* Input Area box */}
                <div className="p-6 bg-white border-t border-gray-50 transition-colors">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                            type="text"
                            className="flex-1 bg-gray-100 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary-500:ring-primary-400 focus:bg-gray-800 transition-all text-gray-900 placeholder:text-gray-400:text-gray-500"
                            placeholder={booking?.status === 'completed' ? "Chat is closed" : "Message your peer..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={booking?.status === 'completed'}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || booking?.status === 'completed'}
                            className="bg-primary-600 hover:bg-primary-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                        >
                            <Send size={22} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </form>
                    {booking?.status !== 'completed' && (
                        <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            Your conversation is protected by our peer-safety guidelines
                        </p>
                    )}
                </div>
            </div>

            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                bookingId={bookingId || ''}
            />
        </div>
    );
}

