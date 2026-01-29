import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { getBookings, updateBookingStatus, releaseEscrow, refundEscrow, claimNoShowRefund } from '../lib/api';
import { Loader2, Video, X, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { format } from 'date-fns';
import ReviewModal from '../components/ReviewModal';

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
        <div className="min-h-[calc(100vh-64px)] pb-20">
            {/* Header section with role switcher */}
            <div className="bg-white border-b border-gray-100 mb-6 transition-colors duration-300">
                <div className="w-full px-6 xl:px-12 py-6 md:py-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-black tracking-tight">Your <span className="text-primary-600">Bookings</span></h1>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Learning & Teaching</p>
                        </div>

                        <div className="bg-gray-50 p-1 rounded-xl flex items-center border border-gray-200">
                            <button
                                onClick={() => setRole('student')}
                                className={clsx(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                                    role === 'student' ? "bg-white text-black shadow-sm" : "text-gray-500"
                                )}
                            >
                                Learning
                            </button>
                            <button
                                onClick={() => setRole('provider')}
                                className={clsx(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                                    role === 'provider' ? "bg-white text-black shadow-sm" : "text-gray-500"
                                )}
                            >
                                Teaching
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-6 xl:px-12 pb-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-primary-600" size={32} />
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center">
                        <h3 className="text-lg font-bold text-black mb-2">No active sessions</h3>
                        <Link to="/marketplace" className="text-primary-600 font-black text-xs hover:underline">Browse Market</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col">
                                {/* Status & Payment Badges */}
                                <div className="flex items-start justify-between mb-4 gap-2">
                                    <div className="flex flex-wrap gap-2">
                                        <span className={clsx("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", getStatusStyles(booking.status))}>
                                            {booking.status === 'requested' ? 'Awaiting Approval' : booking.status}
                                        </span>
                                        {getPaymentBadge(booking.paymentStatus)}
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">
                                        REF {booking._id.slice(-4).toUpperCase()}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-black mb-4 line-clamp-1">
                                    {booking.skillId?.title || 'Skill Session'}
                                </h3>

                                {/* Escrow Amount Display */}
                                {booking.escrow && (
                                    <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                                <Shield size={14} />
                                                {booking.paymentStatus === 'released' ? 'Amount Received' : 'Secured Amount'}
                                            </span>
                                            <span className="text-lg font-black text-emerald-700">₹{booking.escrow.amount}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Date</p>
                                        <p className="text-xs font-bold text-black">{format(new Date(booking.date), 'MMM d')}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Time</p>
                                        <p className="text-xs font-bold text-black">{format(new Date(booking.date), 'p')}</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                                    <p className="text-xs font-bold text-gray-500">
                                        {booking.otherUser?.firstName}
                                    </p>

                                    <div className="flex items-center gap-2">
                                        {/* Provider Actions: Approve/Reject for Requested status */}
                                        {booking.status === 'requested' && role === 'provider' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(booking._id)}
                                                    disabled={processingId === booking._id}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(booking)}
                                                    disabled={processingId === booking._id}
                                                    className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-[10px] font-black hover:bg-rose-50 transition-colors disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {/* Student: Cancel if requested (before approval) */}
                                        {booking.status === 'requested' && role === 'student' && (
                                            <button
                                                onClick={() => handleCancelBooking(booking)}
                                                disabled={processingId === booking._id}
                                                className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : <><X size={14} /> Cancel</>}
                                            </button>
                                        )}

                                        {/* Active Session Actions */}
                                        {booking.status === 'approved' && (
                                            <>
                                                {/* Chat Link */}
                                                <Link
                                                    to={`/chat?booking=${booking._id}`}
                                                    className="px-3 py-2 bg-primary-50 text-primary-600 border border-primary-100 rounded-lg text-[10px] font-black hover:bg-primary-100 transition-colors"
                                                >
                                                    Chat
                                                </Link>

                                                {/* Join Meeting */}
                                                {booking.meetingLink && (
                                                    <Link
                                                        to={`/meeting/${booking._id}`}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-blue-500/10 flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Video size={14} />
                                                    </Link>
                                                )}

                                                {/* Provider: End Session Button */}
                                                {role === 'provider' && (
                                                    <div className="relative group/tooltip">
                                                        <button
                                                            onClick={() => handleEndSession(booking)}
                                                            disabled={processingId === booking._id || !booking.providerJoined}
                                                            className={clsx(
                                                                "px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50",
                                                                !booking.providerJoined
                                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                                                    : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                                                            )}
                                                        >
                                                            {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : 'End & Release ₹'}
                                                        </button>
                                                        {!booking.providerJoined && (
                                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 w-fit">
                                                                Join meeting first
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Student: Claim Refund if Provider No-Show */}
                                                {role === 'student' &&
                                                    new Date() > new Date(new Date(booking.date).getTime() + (booking.duration || 60) * 60000) &&
                                                    !booking.providerJoined && (
                                                        <button
                                                            onClick={() => handleClaimRefund(booking)}
                                                            disabled={processingId === booking._id}
                                                            className="px-3 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[10px] font-bold hover:bg-orange-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                            title="Provider missed session? Claim refund."
                                                        >
                                                            {processingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : <><AlertCircle size={14} /> Claim Refund</>}
                                                        </button>
                                                    )}
                                            </>
                                        )}

                                        {/* Completed Status */}
                                        {booking.status === 'completed' && (
                                            <span className="flex items-center gap-1 px-3 py-2 bg-sky-50 text-sky-700 rounded-lg text-[10px] font-bold">
                                                <CheckCircle size={14} />
                                                Completed
                                            </span>
                                        )}

                                        {/* Cancelled/Rejected with Refund Info */}
                                        {(booking.status === 'cancelled' || booking.status === 'rejected') && booking.paymentStatus === 'refunded' && (
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                Refunded
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
