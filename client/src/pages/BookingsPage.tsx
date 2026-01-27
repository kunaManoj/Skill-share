import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { getBookings, updateBookingStatus } from '../lib/api';
import { Loader2, Video, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function BookingsPage() {
    const { user } = useUser();
    const [role, setRole] = useState<'student' | 'provider'>('student');
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleStatusUpdate = async (bookingId: string, status: string) => {
        try {
            await updateBookingStatus(bookingId, status);
            setBookings(prev => prev.map(b =>
                b._id === bookingId ? { ...b, status } : b
            ));
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'completed': return 'bg-sky-50 text-sky-700 border-sky-100';
            case 'requested': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
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
                                <div className="flex items-start justify-between mb-4">
                                    <span className={clsx("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", getStatusStyles(booking.status))}>
                                        {booking.status}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                        REF {booking._id.slice(-4).toUpperCase()}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-black mb-4 line-clamp-1">
                                    {booking.skillId?.title || 'Skill Session'}
                                </h3>

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
                                        {/* Provider Actions */}
                                        {booking.status === 'requested' && role === 'provider' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(booking._id, 'approved')}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                                                    className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-[10px] font-black hover:bg-rose-50 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {/* Student Actions: Cancel if requested */}
                                        {booking.status === 'requested' && role === 'student' && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to cancel this booking request?')) {
                                                        try {
                                                            await updateBookingStatus(booking._id, 'cancelled');
                                                            setBookings(prev => prev.map(b => b._id === booking._id ? { ...b, status: 'cancelled' } : b));
                                                            toast.success('Booking cancelled');
                                                        } catch (e) {
                                                            toast.error('Failed to cancel');
                                                        }
                                                    }
                                                }}
                                                className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors flex items-center gap-1"
                                            >
                                                <X size={14} />
                                                Cancel
                                            </button>
                                        )}

                                        {booking.status === 'approved' && (
                                            <>
                                                {booking.meetingLink && (
                                                    <Link
                                                        to={`/meeting/${booking._id}`}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-blue-500/10 flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Video size={14} />
                                                        Join Room
                                                    </Link>
                                                )}

                                                <button
                                                    onClick={() => handleStatusUpdate(booking._id, 'completed')}
                                                    className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-[10px] font-bold hover:bg-gray-50 flex items-center gap-1.5"
                                                    title="Mark as Completed"
                                                >
                                                    <CheckCircle size={14} className="text-green-600" />
                                                    End
                                                </button>

                                                <Link
                                                    to={`/chat?booking=${booking._id}`}
                                                    className="px-3 py-2 bg-primary-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-primary-500/10 hover:bg-primary-700 transition-colors"
                                                >
                                                    Chat
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


        </div>
    );
}
