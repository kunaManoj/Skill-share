import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, X, Shield, CreditCard, Loader2 } from 'lucide-react';
import { createBooking, createEscrowOrder, verifyEscrowPayment } from '../lib/api';
import { toast } from 'sonner';

interface BookingModalProps {
    skillId: string;
    skillTitle: string;
    providerId: string;
    studentId: string;
    price: number;
    isOpen: boolean;
    onClose: () => void;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function BookingModal({ skillId, skillTitle, providerId, studentId, price, isOpen, onClose }: BookingModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'details' | 'payment'>('details');

    if (!isOpen) return null;

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!date || !time) {
            toast.error('Please select date and time');
            return;
        }

        setStep('payment');
    };

    const handlePayment = async () => {
        if (!studentId || !providerId) {
            toast.error('Missing user information. Please refreshing the page.');
            return;
        }

        if (!window.Razorpay) {
            toast.error('Payment gateway failed to load. Please check your internet connection.');
            return;
        }

        if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
            toast.error('Payment configuration missing.');
            return;
        }

        setLoading(true);

        try {
            const dateTime = new Date(`${date}T${time}`);

            // Step 1: Create booking in pending_payment status
            const booking = await createBooking({
                skillId,
                providerId,
                studentId,
                date: dateTime.toISOString(),
                note
            });

            // Step 2: Create escrow order
            const order = await createEscrowOrder(price, booking._id);

            // Step 3: Open Razorpay checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
                amount: order.amount,
                currency: order.currency,
                name: "SkillShare Marketplace",
                description: `Pre-payment for ${skillTitle}`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        // Step 4: Verify payment and hold in escrow
                        await verifyEscrowPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: booking._id,
                            amount: price
                        });

                        toast.success('Booking confirmed! Payment secured in escrow.');
                        onClose();
                        // Optionally redirect to bookings page
                        window.location.href = '/bookings';
                    } catch (verifyErr) {
                        console.error('Verification failed', verifyErr);
                        toast.error('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    email: '',
                },
                theme: { color: "#7c3aed" },
                modal: {
                    ondismiss: function () {
                        toast.info('Payment cancelled. Your booking is pending.');
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error(`Payment Failed: ${response.error.description}`);
                setLoading(false);
            });
            rzp.open();

        } catch (error: any) {
            console.error('Booking/Payment failed:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to process booking. Please try again.';
            toast.error(errorMessage);
            setLoading(false);
        }
    };

    const handleBack = () => {
        setStep('details');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
                    >
                        {/* Background Glow */}


                        {/* Header */}
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]/80 backdrop-blur-sm relative z-10">
                            <div>
                                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                                    {step === 'details' ? 'Book Session' : 'Secure Payment'}
                                </h2>
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">
                                    {step === 'details' ? 'Step 1 of 2' : 'Step 2 of 2'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 hover:bg-[var(--bg-glass-subtle)] rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative z-10">
                            <AnimatePresence mode="wait">
                                {step === 'details' ? (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <form onSubmit={handleDetailsSubmit} className="p-6 space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Skill</label>
                                                <div className="text-[var(--text-primary)] font-bold bg-[var(--bg-glass-subtle)] px-4 py-3 rounded-xl border border-[var(--border-color)] flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                                                    {skillTitle}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Date</label>
                                                    <div className="relative group">
                                                        <Calendar className="absolute left-3 top-3 text-[var(--text-secondary)] group-focus-within:text-primary-500 transition-colors" size={18} />
                                                        <input
                                                            type="date"
                                                            required
                                                            min={new Date().toISOString().split('T')[0]}
                                                            className="block w-full pl-10 pr-3 py-2.5 border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-[var(--bg-card)] text-[var(--text-primary)] font-medium transition-all outline-none"
                                                            value={date}
                                                            onChange={e => setDate(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Time</label>
                                                    <div className="relative group">
                                                        <Clock className="absolute left-3 top-3 text-[var(--text-secondary)] group-focus-within:text-primary-500 transition-colors" size={18} />
                                                        <input
                                                            type="time"
                                                            required
                                                            className="block w-full pl-10 pr-3 py-2.5 border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-[var(--bg-card)] text-[var(--text-primary)] font-medium transition-all outline-none"
                                                            value={time}
                                                            onChange={e => setTime(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Message for Provider</label>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Hi, I need help with..."
                                                    className="block w-full p-3 border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all outline-none resize-none font-medium"
                                                    value={note}
                                                    onChange={e => setNote(e.target.value)}
                                                />
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all"
                                            >
                                                Continue to Payment
                                            </motion.button>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="payment"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-6 space-y-6"
                                    >
                                        {/* Escrow Info Banner */}
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                            <div className="flex items-start gap-3 relative z-10">
                                                <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
                                                    <Shield size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-emerald-500 text-sm">Secure Escrow Payment</h3>
                                                    <p className="text-emerald-500/80 text-xs mt-1 leading-relaxed font-medium">
                                                        Your payment is held securely until the session wraps up.
                                                        Full refund if the provider cancels.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Summary */}
                                        <div className="bg-[var(--bg-card)] rounded-2xl p-5 space-y-4 border border-[var(--border-color)]">
                                            <h3 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wide">Order Summary</h3>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-secondary)] font-medium">Skill</span>
                                                    <span className="font-bold text-[var(--text-primary)]">{skillTitle}</span>
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-secondary)] font-medium">Date & Time</span>
                                                    <span className="font-bold text-[var(--text-primary)]">
                                                        {date && time ? new Date(`${date}T${time}`).toLocaleString('en-IN', {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        }) : '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="border-t border-[var(--border-color)] pt-4 mt-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-black text-[var(--text-primary)]">Total</span>
                                                    <span className="text-2xl font-black text-primary-600">₹{price}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={handleBack}
                                                disabled={loading}
                                                className="flex-1 py-3.5 bg-[var(--bg-glass-subtle)] hover:bg-[var(--bg-glass-strong)] border border-[var(--border-color)] text-[var(--text-secondary)] font-bold rounded-xl transition-all disabled:opacity-50"
                                            >
                                                Back
                                            </button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handlePayment}
                                                disabled={loading}
                                                className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 size={18} className="animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard size={18} />
                                                        Pay ₹{price}
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
