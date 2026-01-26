import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import api, { getReviewsForSkill, deleteSkill } from '../lib/api';

import BookingModal from '../components/BookingModal';
import { Clock, Award, MessageSquare, ChevronLeft, Star, Globe, Zap, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { format } from 'date-fns';
import SEO from '../components/SEO';

export default function SkillDetailPage() {
    const { id } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();
    const [skill, setSkill] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    useEffect(() => {
        const fetchSkill = async () => {
            try {
                const response = await api.get(`/skills/${id}`);
                setSkill(response.data);
                const reviewsData = await getReviewsForSkill(id!);
                setReviews(reviewsData);
            } catch (error) {
                console.error('Error fetching skill:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSkill();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
            <Zap className="animate-pulse text-primary-600" size={48} />
        </div>
    );

    if (!skill) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Skill not found</h2>
            <Link to="/marketplace" className="mt-4 text-primary-600 hover:underline inline-block">Return to Marketplace</Link>
        </div>
    );

    return (
        <div className="min-h-screen pb-16 pt-6">
            <SEO
                title={skill.title}
                description={skill.description}
                type="article"
            />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary-600 font-bold text-xs mb-6 transition-colors group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 md:p-10 border border-gray-200 shadow-sm transition-colors duration-300">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider border border-primary-100 mb-4">
                                {skill.category}
                            </span>

                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                                {skill.title}
                            </h1>

                            <div className="flex flex-wrap gap-3 mb-8">
                                <InfoBadge icon={<Award size={16} />} label={skill.experience} />
                                <InfoBadge icon={<Clock size={16} />} label="60 min" />
                                <InfoBadge icon={<Globe size={16} />} label="English / Hindi" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900">About</h2>
                                <p className="text-gray-600 leading-relaxed text-sm">
                                    {skill.description}
                                </p>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-white rounded-2xl p-6 md:p-10 border border-gray-200 shadow-sm transition-colors duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <Star size={16} className="text-amber-500" fill="currentColor" />
                                    <span className="text-sm font-bold text-gray-900">
                                        {skill.provider?.averageRating?.toFixed(1) || '0.0'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium tracking-tight">({reviews.length})</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 italic text-sm">No reviews yet.</div>
                                ) : (
                                    reviews.map((review: any) => (
                                        <div key={review._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    {review.reviewerImage ? (
                                                        <img src={review.reviewerImage} alt={review.reviewerName} className="w-8 h-8 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                            {review.reviewerName?.[0] || 'U'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-xs">{review.reviewerName}</p>
                                                        <div className="flex text-amber-500 scale-75 origin-left">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {format(new Date(review.createdAt), 'MMM d')}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-xs">
                                                {review.comment}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Booking Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl transition-colors duration-300">
                            <div className="mb-6">
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Rate</span>
                                <div className="flex items-baseline gap-1.5 mt-1">
                                    <span className="text-4xl font-black text-gray-900">₹{skill.price}</span>
                                    <span className="text-gray-400 font-medium text-xs">/ session</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {user && user.id === skill.providerId ? (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
                                                try {
                                                    await deleteSkill(skill._id, user.id);
                                                    toast.success('Skill deleted successfully');
                                                    navigate('/marketplace');
                                                } catch (err) {
                                                    // console.error(err);
                                                    toast.error('Failed to delete skill');
                                                }
                                            }
                                        }}
                                        className="w-full py-4 px-6 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Delete Skill
                                    </button>
                                ) : (

                                    <>
                                        <button
                                            onClick={() => {
                                                if (!user) navigate('/sign-in');
                                                else setIsBookingOpen(true);
                                            }}
                                            className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/10 transition-all hover:-translate-y-0.5"
                                        >
                                            Book Now
                                        </button>
                                        <button className="w-full py-4 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200:bg-gray-700 transition-all flex items-center justify-center gap-2">
                                            <MessageSquare size={18} />
                                            Message
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Provider Stats Card */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 transition-colors duration-300">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Peer Provider</h3>

                            <div className="flex items-center gap-3 mb-6">
                                {skill.provider?.imageUrl ? (
                                    <img src={skill.provider.imageUrl} alt="Provider" className="w-14 h-14 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-black text-xl">
                                        {skill.provider?.firstName?.[0]}
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-base font-bold text-gray-900 leading-tight">
                                        {skill.provider?.firstName} {skill.provider?.lastName}
                                    </h4>
                                    <p className="text-gray-500 text-xs font-medium">Verified student</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-1">Trust Score</p>
                                    <p className="text-sm font-black text-primary-600">{skill.provider?.trustScore || '85'}%</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-1">Response</p>
                                    <p className="text-sm font-black text-emerald-500">&lt; 2hr</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {skill && user && (
                <BookingModal
                    skillId={skill._id}
                    skillTitle={skill.title}
                    providerId={skill.providerId}
                    studentId={user.id}
                    price={skill.price}
                    isOpen={isBookingOpen}
                    onClose={() => setIsBookingOpen(false)}
                />
            )}
        </div>
    );
}

function InfoBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 text-gray-600 font-bold text-xs shadow-sm">
            <span className="text-primary-600">{icon}</span>
            {label}
        </div>
    );
}
