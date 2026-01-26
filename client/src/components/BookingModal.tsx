import { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import { createBooking } from '../lib/api';
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

export default function BookingModal({ skillId, skillTitle, providerId, studentId, price, isOpen, onClose }: BookingModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dateTime = new Date(`${date}T${time}`);

            await createBooking({
                skillId,
                providerId,
                studentId,
                date: dateTime.toISOString(),
                note
            });

            toast.success('Booking request sent successfully!');
            onClose();
        } catch (error) {
            console.error('Booking failed:', error);
            toast.error('Failed to send booking request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900">Book Session</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600:text-gray-300 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                        <div className="text-gray-900 font-semibold">{skillTitle}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="time"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
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
                            className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder:text-gray-400:text-gray-500"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-4 text-sm">
                            <span className="text-gray-600">Total Price</span>
                            <span className="text-xl font-bold text-gray-900">₹{price}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending Request...' : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
