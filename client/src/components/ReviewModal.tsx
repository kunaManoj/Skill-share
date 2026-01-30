import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { createReview } from '../lib/api';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
}

export default function ReviewModal({ isOpen, onClose, bookingId }: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createReview({
                bookingId,
                rating,
                comment,
            });
            // alert('Review submitted successfully!'); // Removed alert for smoother UX
            onClose();
            // Force reload to update booking list UI
            window.location.reload();
        } catch (error) {
            console.error('Failed to submit review:', error);
            // alert('Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Rate Session</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100:bg-gray-900 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center gap-2">
                            <label className="text-sm font-medium text-gray-600">How was your experience?</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            size={32}
                                            className={clsx(
                                                "transition-colors",
                                                star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Write a review</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none bg-white text-gray-900 placeholder:text-gray-400:text-gray-500"
                                placeholder="Share details about what you learned..."
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50:bg-gray-900 transition-colors"
                            >
                                Skip
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
