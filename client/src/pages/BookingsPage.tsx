import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { getBookings, updateBookingStatus, releaseEscrow, refundEscrow, claimNoShowRefund } from '../lib/api';
import { Loader2, Video, X, Shield, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { format } from 'date-fns';
import ReviewModal from '../components/ReviewModal';

import { motion, AnimatePresence } from 'framer-motion';

export default function BookingsPage() {
    const { user } = useUser();
    const [role, setRole] = useState<'student' | 'provider'>('student');
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchBookings();
    }, [user, role]);

    const fetchBookings = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getBookings(user.id, role);
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (bookingId: string) => {
        try {
            await updateBookingStatus(bookingId, 'approved');
            setBookings(prev => prev.map(b =>
                b._id === bookingId ? { ...b, status: 'approved', meetingLink: `/meeting/${bookingId}` } : b
            ));
            toast.success('Booking approved! Meeting link generated.');
        } catch (error) {
            console.error('Failed to approve', error);
            toast.error('Failed to approve booking');
        }
    };

    const handleReject = async (booking: any) => {
        if (!confirm('Reject this booking? The student will receive a full refund.')) return;

        setProcessingId(booking._id);
        try {
            // First update status to rejected
            await updateBookingStatus(booking._id, 'rejected');

            // Then process refund
            if (booking.paymentStatus === 'paid') {
                await refundEscrow(booking._id, 'Provider rejected the booking');
            }

            setBookings(prev => prev.map(b =>
                b._id === booking._id ? { ...b, status: 'rejected', paymentStatus: 'refunded' } : b
            ));
            toast.success('Booking rejected. Student will be refunded.');
        } catch (error) {
            console.error('Failed to reject', error);
            toast.error('Failed to reject booking');
        } finally {
            setProcessingId(null);
        }
    };

    // Provider: End session and release funds
    const handleEndSession = async (booking: any) => {
        if (!confirm('End this session and release payment to your wallet?')) return;

        setProcessingId(booking._id);
        try {
            // Release escrow funds to provider
            await releaseEscrow(booking._id);

            setBookings(prev => prev.map(b =>
                b._id === booking._id ? { ...b, status: 'completed', paymentStatus: 'released' } : b
            ));
            toast.success('Session completed! Payment released to your wallet.');
        } catch (error) {
            console.error('Failed to end session', error);
            toast.error('Failed to end session');
        } finally {
            setProcessingId(null);
        }
    };

    // Student: Cancel booking (before approval)
    const handleCancelBooking = async (booking: any) => {
        const message = booking.paymentStatus === 'paid'
            ? 'Cancel this booking? You will receive a full refund.'
            : 'Cancel this booking request?';

        if (!confirm(message)) return;

        setProcessingId(booking._id);
        try {
            await updateBookingStatus(booking._id, 'cancelled', { cancelledBy: user?.id });

            // Refund if paid
            if (booking.paymentStatus === 'paid') {
                await refundEscrow(booking._id, 'Student cancelled the booking');
            }

            setBookings(prev => prev.map(b =>
                b._id === booking._id ? { ...b, status: 'cancelled', paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : b.paymentStatus } : b
            ));
            toast.success(booking.paymentStatus === 'paid' ? 'Booking cancelled. Refund processed.' : 'Booking cancelled.');
        } catch (error) {
            console.error('Failed to cancel', error);
            toast.error('Failed to cancel booking');
        } finally {
            setProcessingId(null);
        }
    };

    const handleClaimRefund = async (booking: any) => {
        if (!confirm('Provider missed the session? Claim full refund now?')) return;
        setProcessingId(booking._id);
        try {
            await claimNoShowRefund(booking._id);
            setBookings(prev => prev.map(b =>
                b._id === booking._id ? { ...b, status: 'cancelled', paymentStatus: 'refunded' } : b
            ));
            toast.success('Refund processed successfully');
        } catch (error: any) {
            console.error('Refund claim failed', error);
            toast.error(error.response?.data?.error || 'Failed to claim refund');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'rejected': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            case 'completed': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
            case 'pending_payment': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'requested': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'cancelled': return 'bg-gray-500/10 text-[var(--text-secondary)] border-gray-500/20';
            default: return 'bg-gray-500/10 text-[var(--text-secondary)] border-gray-500/20';
        }
    };

    const getPaymentBadge = (paymentStatus: string) => {
        switch (paymentStatus) {
            case 'paid':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-bold border border-emerald-500/20">
                        <Shield size={10} />
                        Paid (Escrow)
                    </span>
                );
            case 'released':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full text-[9px] font-bold border border-blue-500/20">
                        <CheckCircle size={10} />
                        Released
                    </span>
                );
            case 'refunded':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-full text-[9px] font-bold border border-orange-500/20">
                        <AlertCircle size={10} />
                        Refunded
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] pb-20 relative overflow-hidden">
            {/* Ambient Background */}


            {/* Header section with role switcher */}
            <div className="bg-[var(--bg-glass-subtle)] backdrop-blur-xl border-b border-[var(--border-color)] mb-6 transition-all duration-300 sticky top-0 z-20 card-shadow">
                <div className="w-full px-6 xl:px-12 py-6 md:py-8">
                    <div className="flex flex-row items-center justify-between gap-4">
                        <div className="section-underline">
                            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Bookings</span></h1>
                        </div>

                        <div className="bg-[var(--bg-card)] p-1.5 rounded-xl flex items-center border border-[var(--border-color)] relative">
                            {(['student', 'provider'] as const).map((tabRole) => (
                                <button
                                    key={tabRole}
                                    onClick={() => setRole(tabRole)}
                                    className={clsx(
                                        "relative px-6 py-2 rounded-lg text-xs font-bold transition-colors duration-200 z-10 w-32",
                                        role === tabRole ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    )}
                                >
                                    {role === tabRole && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-[var(--bg-glass-strong)] shadow-sm rounded-lg border border-[var(--border-color)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">{tabRole === 'student' ? 'Learning' : 'Teaching'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-6 xl:px-12 pb-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="animate-spin text-primary-600" size={40} />
                    </div>
                ) : bookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-32 bg-[var(--bg-glass-subtle)] backdrop-blur-sm rounded-3xl border border-dashed border-[var(--border-color)] flex flex-col items-center max-w-2xl mx-auto"
                    >
                        <div className="w-16 h-16 bg-[var(--bg-card)] rounded-full flex items-center justify-center mb-4">
                            <Video className="text-[var(--text-secondary)]" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No active sessions</h3>
                        <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm mx-auto">
                            {role === 'student'
                                ? "You haven't booked any sessions yet. Find a skill to learn!"
                                : "You haven't received any booking requests yet. Share your profile!"}
                        </p>
                        <Link
                            to="/marketplace"
                            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all hover:-translate-y-1 active:scale-95 text-sm"
                        >
                            Browse Marketplace
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {bookings.map((booking, index) => (
                                <motion.div
                                    layout
                                    key={booking._id}
                                    style={{ willChange: 'transform, opacity' }}
                                    className="group bg-[var(--bg-card)] backdrop-blur-sm rounded-xl card-shadow card-glow hover:shadow-md transition-all duration-300 p-3 flex flex-col relative overflow-hidden"
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                >
                                    {/* Hover gradient glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />

                                    {/* Status & Payment Badges */}
                                    <div className="flex items-start justify-between mb-2 gap-2 relative z-10">
                                        <div className="flex flex-wrap gap-2">
                                            <span className={clsx("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-sm", getStatusStyles(booking.status))}>
                                                {booking.status === 'requested' ? 'Awaiting Approval' : booking.status}
                                            </span>
                                            {getPaymentBadge(booking.paymentStatus)}
                                        </div>
                                        <span className="text-[9px] font-bold text-[var(--text-secondary)] group-hover:text-primary-300 transition-colors uppercase tracking-widest flex-shrink-0">
                                            REF {booking._id.slice(-4).toUpperCase()}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-[var(--text-primary)] mb-1.5 line-clamp-1 relative z-10 group-hover:text-primary-700 transition-colors">
                                        {booking.skillId?.title || 'Skill Session'}
                                    </h3>

                                    {/* Escrow Amount Display */}
                                    {booking.escrow && (
                                        <div className="mb-2 px-2 py-1.5 bg-emerald-500/5 backdrop-blur-sm rounded-lg border border-emerald-500/20 relative z-10 group-hover:shadow-sm transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 flex items-center gap-1">
                                                    <Shield size={12} />
                                                    {booking.paymentStatus === 'released' ? 'Received' : 'Secured'}
                                                </span>
                                                <span className="text-sm font-black text-emerald-600">₹{booking.escrow.amount}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-1.5 mb-2 relative z-10">
                                        <div className="px-2 py-1.5 bg-[var(--bg-glass-subtle)] rounded-lg border border-[var(--border-color)] group-hover:bg-[var(--bg-glass-strong)] group-hover:border-primary-100/30 transition-colors">
                                            <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Date</p>
                                            <p className="text-[11px] font-bold text-[var(--text-primary)]">{format(new Date(booking.date), 'MMM d')}</p>
                                        </div>
                                        <div className="px-2 py-1.5 bg-[var(--bg-glass-subtle)] rounded-lg border border-[var(--border-color)] group-hover:bg-[var(--bg-glass-strong)] group-hover:border-primary-100/30 transition-colors">
                                            <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Time</p>
                                            <p className="text-[11px] font-bold text-[var(--text-primary)]">{format(new Date(booking.date), 'p')}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-[var(--border-color)] relative z-10">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 flex items-center justify-center text-[10px] font-black ring-1 ring-[var(--bg-card)] shadow-sm">
                                                {booking.otherUser?.firstName?.[0]}
                                            </div>
                                            <p className="text-[11px] font-bold text-[var(--text-secondary)]">
                                                {booking.otherUser?.firstName}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Provider Actions: Approve/Reject for Requested status */}
                                            {booking.status === 'requested' && role === 'provider' && (
                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleApprove(booking._id)}
                                                        disabled={processingId === booking._id}
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleReject(booking)}
                                                        disabled={processingId === booking._id}
                                                        className="px-4 py-2 bg-[var(--bg-card)] border border-rose-500/30 text-rose-500 rounded-lg text-[10px] font-black hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </motion.button>
                                                </div>
                                            )}

                                            {/* Student: Cancel if requested (before approval) */}
                                            {booking.status === 'requested' && role === 'student' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleCancelBooking(booking)}
                                                    disabled={processingId === booking._id}
                                                    className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : <><X size={14} /> Cancel</>}
                                                </motion.button>
                                            )}

                                            {/* Active Session Actions */}
                                            {booking.status === 'approved' && (
                                                <>
                                                    {/* Chat Link */}
                                                    <Link to={`/chat?booking=${booking._id}`}>
                                                        <motion.div
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="px-3 py-2 bg-[var(--bg-glass-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg text-[10px] font-black hover:bg-[var(--bg-glass-strong)] hover:border-[var(--border-color)] transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                                                        >
                                                            Chat
                                                        </motion.div>
                                                    </Link>

                                                    {/* Join Meeting */}
                                                    {/* Join Meeting - Available until strictly session end time */}
                                                    {(() => {
                                                        const sessionStart = new Date(booking.date).getTime();
                                                        const durationMs = (booking.duration || 60) * 60000;
                                                        const sessionEnd = sessionStart + durationMs;
                                                        const now = new Date().getTime();
                                                        // Allow join 10 mins before, but strictly cut off at session end
                                                        const isAvailable = now >= sessionStart - 600000 && now <= sessionEnd;

                                                        if (isAvailable && booking.status === 'approved') {
                                                            return (
                                                                <Link to={`/meeting/${booking._id}`}>
                                                                    <motion.div
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-blue-500/20 flex items-center gap-1.5 hover:bg-blue-700 transition-colors cursor-pointer"
                                                                    >
                                                                        <Video size={14} />
                                                                        {(role === 'provider' ? booking.providerJoined : booking.studentJoined) ? 'Rejoin' : 'Join'}
                                                                    </motion.div>
                                                                </Link>
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    {/* Settlement Actions - Only available AFTER session end */}
                                                    {(() => {
                                                        const duration = booking.duration || 60;
                                                        const sessionEnd = new Date(booking.date).getTime() + duration * 60000;
                                                        const now = new Date().getTime();

                                                        // STRICT: No claims before session end
                                                        if (now <= sessionEnd) return null;

                                                        const providerOnline = booking.providerOnlineMinutes || 0;
                                                        // const studentOnline = booking.studentOnlineMinutes || 0;
                                                        const requiredTime = duration * 0.7; // 70% Threshold

                                                        // Logic: 
                                                        // 1. Provider >= 70% -> Payment to Provider
                                                        // 2. Provider < 70% -> Refund to Student (Covers no-show, both no-show, partial attendance)

                                                        const providerQualifies = providerOnline >= requiredTime;

                                                        if (role === 'provider') {
                                                            if (providerQualifies) {
                                                                return (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => handleEndSession(booking)}
                                                                        disabled={processingId === booking._id}
                                                                        className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                                                                    >
                                                                        {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : 'Claim Payment'}
                                                                    </motion.button>
                                                                );
                                                            } else {
                                                                return (
                                                                    <div className="px-3 py-2 bg-[var(--bg-glass-subtle)] text-[var(--text-secondary)] rounded-lg text-[10px] font-bold border border-[var(--border-color)] cursor-not-allowed" title="Attendance < 70%">
                                                                        Attendance too low ({Math.round(providerOnline)}m)
                                                                    </div>
                                                                );
                                                            }
                                                        }

                                                        if (role === 'student') {
                                                            if (!providerQualifies) {
                                                                return (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => handleClaimRefund(booking)}
                                                                        disabled={processingId === booking._id}
                                                                        className="px-3 py-2 bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-lg text-[10px] font-bold hover:bg-orange-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                                        title="Provider attendance < 70%"
                                                                    >
                                                                        {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : <><AlertCircle size={14} /> Claim Refund</>}
                                                                    </motion.button>
                                                                );
                                                            } else {
                                                                // Provider qualified, allowing student to mark complete (or they can just wait for provider to claim)
                                                                return (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => setReviewBookingId(booking._id)}
                                                                        disabled={processingId === booking._id}
                                                                        className="px-3 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                                    >
                                                                        Rate Session
                                                                    </motion.button>
                                                                );
                                                            }
                                                        }

                                                        return null;
                                                    })()}
                                                </>
                                            )}

                                            {/* Completed Status */}
                                            {booking.status === 'completed' && (
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1 px-3 py-2 bg-sky-500/10 text-sky-600 rounded-lg text-[10px] font-bold border border-sky-500/20">
                                                        <CheckCircle size={14} />
                                                        Completed
                                                    </span>

                                                    {role === 'student' && !booking.hasReviewed && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setReviewBookingId(booking._id)}
                                                            className="px-3 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                                                        >
                                                            <Star size={14} className="fill-emerald-600/20" /> Rate
                                                        </motion.button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Cancelled/Rejected with Refund Info */}
                                            {(booking.status === 'cancelled' || booking.status === 'rejected') && booking.paymentStatus === 'refunded' && (
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                                                    Refunded
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <ReviewModal
                isOpen={!!reviewBookingId}
                onClose={() => setReviewBookingId(null)}
                bookingId={reviewBookingId || ''}
            />
        </div>
    );
}
