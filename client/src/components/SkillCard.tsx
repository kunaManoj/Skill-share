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
}

import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SkillCard({ skill }: SkillCardProps) {
    const { user } = useUser();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="group relative bg-white/60 backdrop-blur-lg rounded-2xl border border-white/40 shadow-lg shadow-gray-200/50 hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-300 overflow-hidden flex flex-col h-full"
        >
            {/* Subtle Gradient Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-50/0 to-primary-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="p-5 flex-1 flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-primary-100">
                        {skill.category}
                    </span>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                        <Star size={12} className="text-amber-500" fill="currentColor" />
                        <span className="text-[10px] font-bold text-amber-700">
                            {skill.provider?.averageRating ? skill.provider.averageRating.toFixed(1) : 'New'}
                        </span>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                    {skill.title}
                </h3>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            {skill.provider?.imageUrl ? (
                                <img
                                    src={skill.provider.imageUrl}
                                    alt={skill.provider.firstName}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-500 ring-2 ring-white">
                                    {skill.provider?.firstName?.[0] || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-900 font-bold">
                                {skill.provider?.firstName} {skill.provider?.lastName}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 pb-5 relative z-10">
                <Link
                    to={`/skills/${skill._id}`}
                    onClick={(e) => {
                        if (!user) {
                            e.preventDefault();
                            toast.error("Please login to continue with booking");
                        }
                    }}
                    className="flex items-center justify-between w-full bg-white/50 backdrop-blur-sm hover:bg-primary-600 p-3 rounded-xl border border-white/60 hover:border-primary-600 transition-all duration-300 group/btn"
                >
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase group-hover/btn:text-primary-100 transition-colors">Rate</span>
                        <span className="text-lg font-black text-gray-900 group-hover/btn:text-white transition-colors">
                            ₹{skill.price}<span className="text-xs font-medium opacity-60 ml-1">/session</span>
                        </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white text-primary-600 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-primary-600 transition-all shadow-sm">
                        <ArrowRight size={16} />
                    </div>
                </Link>
            </div>
        </motion.div>
    );
}
