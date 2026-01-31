import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';

interface SkillCardProps {
    skill: {
        _id: string;
        title: string;
        category: string;
        price: number;
        experience: string;
        language?: string;
        provider?: {
            firstName: string;
            lastName: string;
            imageUrl: string;
            trustScore: number;
            averageRating?: number;
            totalReviews?: number;
        };
    };
    isOwner?: boolean;
}

import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteSkill } from '../lib/api';
import { useState } from 'react';

export default function SkillCard({ skill, isOwner }: SkillCardProps) {
    const { user } = useUser();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        if (!confirm('Are you sure you want to delete this skill listing?')) return;

        setIsDeleting(true);
        try {
            if (!user) return;
            await deleteSkill(skill._id, user.id);
            toast.success('Skill deleted successfully');
            // Force refresh - in a real app better state management/React Query is advised
            window.location.reload();
        } catch (error) {
            console.error('Failed to delete skill', error);
            toast.error('Failed to delete skill');
            setIsDeleting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="group relative bg-[var(--bg-card)] backdrop-blur-lg rounded-2xl border border-[var(--border-color)] card-shadow card-glow hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full"
        >
            {/* Subtle Gradient Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="p-5 flex-1 flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-primary-500/10 text-primary-600 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-primary-500/20">
                        {skill.category}
                    </span>
                    <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        <Star size={12} className="text-amber-500" fill="currentColor" />
                        <span className="text-[10px] font-bold text-amber-600">
                            {skill.provider?.averageRating ? skill.provider.averageRating.toFixed(1) : 'New'}
                        </span>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                    {skill.title}
                </h3>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            {skill.provider?.imageUrl ? (
                                <img
                                    src={skill.provider.imageUrl}
                                    alt={skill.provider.firstName}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--bg-card)]"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-glass-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] ring-2 ring-[var(--bg-card)]">
                                    {skill.provider?.firstName?.[0] || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-[var(--text-primary)] font-bold">
                                {skill.provider?.firstName} {skill.provider?.lastName}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 pb-5 relative z-10">
                <Link
                    to={isOwner ? "#" : `/skills/${skill._id}`}
                    onClick={(e) => {
                        if (isOwner) e.preventDefault();
                        if (!user && !isOwner) {
                            e.preventDefault();
                            toast.error("Please login to continue with booking");
                        }
                    }}
                    className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all duration-300 group/btn ${isOwner
                        ? 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 cursor-default'
                        : 'bg-[var(--bg-glass-subtle)] backdrop-blur-sm hover:bg-primary-600 border-[var(--border-color)] hover:border-primary-600'
                        }`}
                >
                    {isOwner ? (
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold text-rose-600">My Listing</span>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-500/20 hover:bg-rose-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /> Delete</>}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase group-hover/btn:text-primary-100 transition-colors">Rate</span>
                                <span className="text-lg font-black text-[var(--text-primary)] group-hover/btn:text-white transition-colors">
                                    ₹{skill.price}<span className="text-xs font-medium opacity-60 ml-1">/session</span>
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-white text-primary-600 flex items-center justify-center shadow-lg shadow-black/5 hover:scale-110 transition-all">
                                <ArrowRight size={16} />
                            </div>
                        </>
                    )}
                </Link>
            </div>
        </motion.div>
    );
}
