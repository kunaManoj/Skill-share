import { useState } from 'react';
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 border border-gray-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {step === 'details' ? 'Book Session' : 'Secure Payment'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {step === 'details' ? 'Step 1 of 2' : 'Step 2 of 2'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                        <X size={24} />
                    </button>
                </div>

                {step === 'details' ? (
                    /* Step 1: Session Details */
                    <form onSubmit={handleDetailsSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                            <div className="text-gray-900 font-semibold bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">{skillTitle}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 transition-all duration-200 focus:scale-[1.01] hover:border-primary-300 shadow-sm"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <div className="relative group">
                                    <Clock className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input
                                        type="time"
                                        required
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 transition-all duration-200 focus:scale-[1.01] hover:border-primary-300 shadow-sm"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message for Provider</label>
                            <textarea
                                rows={3}
                                placeholder="Hi, I need help with..."
                                className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:scale-[1.01] hover:border-primary-300 shadow-sm resize-none"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            Continue to Payment
                        </button>
                    </form>
                ) : (
                    /* Step 2: Payment Confirmation */
                    <div className="p-6 space-y-5 animate-in slide-in-from-right-4 duration-300">
                        {/* Escrow Info Banner */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Shield className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h3 className="font-bold text-emerald-800 text-sm">Secure Escrow Payment</h3>
                                    <p className="text-emerald-700 text-xs mt-1">
                                        Your payment is held securely until the session is completed.
                                        If the provider doesn't accept or cancels, you'll get a full refund.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                            <h3 className="font-bold text-gray-900 text-sm">Order Summary</h3>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Skill</span>
                                <span className="font-medium text-gray-900">{skillTitle}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Date & Time</span>
                                <span className="font-medium text-gray-900">
                                    {date && time ? new Date(`${date}T${time}`).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    }) : '-'}
                                </span>
                            </div>

                            <div className="border-t border-gray-200 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-black text-primary-600">₹{price}</span>
                                </div>
                            </div>
                        </div>

                        {/* What happens next */}
                        <div className="space-y-2">
                            <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">What happens next?</h4>
                            <ol className="text-xs text-gray-600 space-y-1.5">
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary-600">1.</span>
                                    Payment is held in escrow
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary-600">2.</span>
                                    Provider reviews and accepts your request
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary-600">3.</span>
                                    You have your session
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary-600">4.</span>
                                    Payment is released to provider after session
                                </li>
                            </ol>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleBack}
                                disabled={loading}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all disabled:opacity-50 hover:-translate-y-0.5 active:scale-95"
                            >
                                Back
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
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
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
