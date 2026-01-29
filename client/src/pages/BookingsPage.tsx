import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { getBookings, updateBookingStatus, releaseEscrow, refundEscrow, claimNoShowRefund } from '../lib/api';
import { Loader2, Video, X, Shield, CheckCircle, AlertCircle } from 'lucide-react';
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
            await updateBookingStatus(booking._id, 'cancelled');

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
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'completed': return 'bg-sky-50 text-sky-700 border-sky-100';
            case 'pending_payment': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'requested': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'cancelled': return 'bg-gray-50 text-gray-600 border-gray-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getPaymentBadge = (paymentStatus: string) => {
        switch (paymentStatus) {
            case 'paid':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold">
                        <Shield size={10} />
                        Paid (Escrow)
                    </span>
                );
            case 'released':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold">
                        <CheckCircle size={10} />
                        Released
                    </span>
                );
            case 'refunded':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[9px] font-bold">
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
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-100/30 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-multiply" />
            <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply" />

            {/* Header section with role switcher */}
            <div className="bg-white/60 backdrop-blur-xl border-b border-white/30 mb-6 transition-all duration-300 sticky top-0 z-20">
                <div className="w-full px-6 xl:px-12 py-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Bookings</span></h1>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Learning & Teaching</p>
                        </div>

                        <div className="bg-gray-100/50 p-1.5 rounded-xl flex items-center border border-gray-200/50 relative">
                            {(['student', 'provider'] as const).map((tabRole) => (
                                <button
                                    key={tabRole}
                                    onClick={() => setRole(tabRole)}
                                    className={clsx(
                                        "relative px-6 py-2 rounded-lg text-xs font-bold transition-colors duration-200 z-10 w-32",
                                        role === tabRole ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {role === tabRole && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white shadow-sm rounded-lg border border-gray-200/50"
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
                        className="text-center py-32 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200 flex flex-col items-center max-w-2xl mx-auto"
                    >
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Video className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No active sessions</h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
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
                                    className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm shadow-gray-100/50 hover:shadow-md hover:shadow-primary-500/10 hover:border-primary-100/50 transition-all duration-300 p-4 flex flex-col relative overflow-hidden"
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                >
                                    {/* Hover gradient glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />

                                    {/* Status & Payment Badges */}
                                    <div className="flex items-start justify-between mb-4 gap-2 relative z-10">
                                        <div className="flex flex-wrap gap-2">
                                            <span className={clsx("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm", getStatusStyles(booking.status))}>
                                                {booking.status === 'requested' ? 'Awaiting Approval' : booking.status}
                                            </span>
                                            {getPaymentBadge(booking.paymentStatus)}
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-300 group-hover:text-primary-300 transition-colors uppercase tracking-widest flex-shrink-0">
                                            REF {booking._id.slice(-4).toUpperCase()}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 relative z-10 group-hover:text-primary-700 transition-colors">
                                        {booking.skillId?.title || 'Skill Session'}
                                    </h3>

                                    {/* Escrow Amount Display */}
                                    {booking.escrow && (
                                        <div className="mb-3 p-2.5 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-sm rounded-xl border border-emerald-100/60 relative z-10 group-hover:shadow-sm transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 flex items-center gap-1.5">
                                                    <Shield size={14} />
                                                    {booking.paymentStatus === 'released' ? 'Amount Received' : 'Secured Amount'}
                                                </span>
                                                <span className="text-base font-black text-emerald-700">₹{booking.escrow.amount}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 mb-3 relative z-10">
                                        <div className="p-2 bg-gray-50/80 rounded-xl border border-gray-100 group-hover:bg-white group-hover:border-primary-100/30 transition-colors">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Date</p>
                                            <p className="text-xs font-bold text-gray-900">{format(new Date(booking.date), 'MMM d')}</p>
                                        </div>
                                        <div className="p-2 bg-gray-50/80 rounded-xl border border-gray-100 group-hover:bg-white group-hover:border-primary-100/30 transition-colors">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Time</p>
                                            <p className="text-xs font-bold text-gray-900">{format(new Date(booking.date), 'p')}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 flex items-center justify-center text-xs font-black ring-2 ring-white shadow-sm">
                                                {booking.otherUser?.firstName?.[0]}
                                            </div>
                                            <p className="text-xs font-bold text-gray-600">
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
                                                        className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-[10px] font-black hover:bg-rose-50 transition-colors disabled:opacity-50"
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
                                                            className="px-3 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-[10px] font-black hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                                                        >
                                                            Chat
                                                        </motion.div>
                                                    </Link>

                                                    {/* Join Meeting */}
                                                    {/* Join Meeting - Only show if within time window (start time - 10m to end time + 30m) */}
                                                    {(() => {
                                                        const sessionStart = new Date(booking.date).getTime();
                                                        const durationMs = (booking.duration || 60) * 60000;
                                                        const sessionEnd = sessionStart + durationMs;
                                                        const now = new Date().getTime();
                                                        const isWithinWindow = now >= sessionStart - 600000 && now <= sessionEnd + 1800000; // 10 min early, 30 min late buffer

                                                        if (isWithinWindow && booking.status === 'approved') {
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

                                                    {/* Provider: End Session / Claim Logic */}
                                                    {role === 'provider' && booking.status === 'approved' && (() => {
                                                        const duration = booking.duration || 60;
                                                        const providerOnline = booking.providerOnlineMinutes || 0;
                                                        const studentOnline = booking.studentOnlineMinutes || 0;

                                                        const now = new Date().getTime();
                                                        const sessionStart = new Date(booking.date).getTime();
                                                        const sessionEnd = sessionStart + duration * 60000;

                                                        const requiredTime = duration * 0.7; // 70% Threshold

                                                        // 1. Success: Provider met 70% requirement
                                                        const metRequirement = providerOnline >= requiredTime;

                                                        // 2. Student No-Show: 20 mins passed, Student absent (<5m), Provider waited (>15m)
                                                        const studentNoShow = now > sessionStart + 1200000 && studentOnline < 5 && providerOnline >= 15;

                                                        // 3. Student Left Early: Session over, Provider stayed longer than student
                                                        const studentLeftEarly = now > sessionEnd && providerOnline > studentOnline + 5; // 5 min buffer

                                                        const canClaim = metRequirement || studentNoShow || studentLeftEarly;

                                                        let statusText = "";
                                                        if (!canClaim) {
                                                            if (now < sessionEnd) statusText = `Target: ${Math.ceil(requiredTime)} mins (Tracked: ${providerOnline})`;
                                                            else statusText = "Attendance requirement not met";
                                                        }

                                                        return (
                                                            <div className="relative group/tooltip">
                                                                <motion.button
                                                                    whileHover={canClaim ? { scale: 1.05 } : {}}
                                                                    whileTap={canClaim ? { scale: 0.95 } : {}}
                                                                    onClick={() => handleEndSession(booking)}
                                                                    disabled={processingId === booking._id || !canClaim}
                                                                    className={clsx(
                                                                        "px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-md",
                                                                        !canClaim
                                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none"
                                                                            : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20"
                                                                    )}
                                                                >
                                                                    {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> :
                                                                        studentNoShow ? 'Claim No-Show' : 'End Session'}
                                                                </motion.button>

                                                                {!canClaim && (
                                                                    <div className="absolute bottom-full mb-2 right-0 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-[9px] rounded-lg w-max max-w-[200px] opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl border border-white/10">
                                                                        <p className="font-bold mb-1 text-gray-300">Cannot claim yet</p>
                                                                        <p>{statusText}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Student: Claim Refund Logic */}
                                                    {role === 'student' && booking.status === 'approved' && (() => {
                                                        const duration = booking.duration || 60;
                                                        const sessionEnd = new Date(booking.date).getTime() + duration * 60000;
                                                        const now = new Date().getTime();
                                                        const isSessionOver = now > sessionEnd;

                                                        const providerOnline = booking.providerOnlineMinutes || 0;
                                                        const studentOnline = booking.studentOnlineMinutes || 0;

                                                        // Refund Conditions:
                                                        // 1. Session must be Over
                                                        // 2. Provider failed 70% requirement
                                                        // 3. AND Provider did NOT outlast the Student (prevents refund if student left first)
                                                        // OR Provider is total no-show (<5 mins)

                                                        const providerFailed = providerOnline < (duration * 0.7);
                                                        const providerLeftEarly = providerOnline < studentOnline;
                                                        const providerNoShow = providerOnline < 5;

                                                        const canRefund = isSessionOver && (providerNoShow || (providerFailed && providerLeftEarly));

                                                        if (isSessionOver) {
                                                            if (canRefund) {
                                                                return (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => handleClaimRefund(booking)}
                                                                        disabled={processingId === booking._id}
                                                                        className="px-3 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[10px] font-bold hover:bg-orange-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                                        title="Provider missed session or left early"
                                                                    >
                                                                        {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : <><AlertCircle size={14} /> Claim Refund</>}
                                                                    </motion.button>
                                                                );
                                                            } else {
                                                                // If session over but Provider succeded (or student failed worse), allow 'Mark Completed'
                                                                return (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => handleEndSession(booking)}
                                                                        disabled={processingId === booking._id}
                                                                        className="px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                                    >
                                                                        {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle size={14} /> Mark Completed</>}
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
                                                <span className="flex items-center gap-1 px-3 py-2 bg-sky-50 text-sky-700 rounded-lg text-[10px] font-bold border border-sky-100">
                                                    <CheckCircle size={14} />
                                                    Completed
                                                </span>
                                            )}

                                            {/* Cancelled/Rejected with Refund Info */}
                                            {(booking.status === 'cancelled' || booking.status === 'rejected') && booking.paymentStatus === 'refunded' && (
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
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
