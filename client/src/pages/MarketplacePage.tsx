import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSkills } from '../lib/api';
import SkillCard from '../components/SkillCard';
import { Search, Filter, SlidersHorizontal, ArrowDownUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MarketplaceSkeleton } from '../components/Skeleton';
import SEO from '../components/SEO';

const CATEGORIES = ['All', 'Academic', 'Programming', 'Music', 'Language', 'Art', 'Other'];
const SORT_OPTIONS = [
    { label: 'Recommended', value: 'recommended' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Highest Rated', value: 'rating_desc' }
];

export default function MarketplacePage() {
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortBy, setSortBy] = useState('recommended');

    const selectedCategory = searchParams.get('category') || 'All';
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        const fetchSkills = async () => {
            setLoading(true);
            try {
                const filters: any = {};
                if (selectedCategory !== 'All') filters.category = selectedCategory;
                if (searchQuery) filters.search = searchQuery;

                const data = await getSkills(filters);
                setSkills(data);
            } catch (error) {
                console.error('Failed to load skills:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSkills();
    }, [selectedCategory, searchQuery]);

    const handleCategoryChange = (category: string) => {
        if (category === 'All') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', category);
        }
        setSearchParams(searchParams);
    };

    const sortedSkills = useMemo(() => {
        let sorted = [...skills];
        switch (sortBy) {
            case 'price_asc':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price_desc':
                return sorted.sort((a, b) => b.price - a.price);
            case 'rating_desc':
                return sorted.sort((a, b) => (b.provider?.averageRating || 0) - (a.provider?.averageRating || 0));
            default:
                return sorted;
        }
    }, [skills, sortBy]);

    return (
        <div className="min-h-[calc(100vh-64px)] pb-20">
            <SEO
                title={selectedCategory !== 'All' ? `${selectedCategory} Skills` : 'Marketplace'}
                description="Browse and book skills from students on campus."
            />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/60 backdrop-blur-xl border-b border-white/30 relative overflow-hidden"
            >
                {/* Ambient Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-200/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="w-full px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">

                    {/* Left Side: Title & Categories */}
                    <div className="flex-1 space-y-6 w-full">
                        <div className="space-y-2 max-w-2xl">
                            <h1 className="text-3xl md:text-5xl font-black text-gray-950 tracking-tight">
                                Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 animate-shimmer bg-[length:200%_auto]">Skills</span>
                            </h1>
                            <p className="text-base text-gray-600 font-medium">
                                Connect with the most talented peers on campus.
                            </p>
                        </div>

                        {/* Categories Chips */}
                        <div className="flex items-center gap-2 overflow-x-auto p-1 py-2 no-scrollbar">
                            <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200 mr-1 shrink-0">
                                <SlidersHorizontal size={14} className="text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</span>
                            </div>
                            <AnimatePresence>
                                {CATEGORIES.map((cat, index) => (
                                    <motion.button
                                        key={cat}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleCategoryChange(cat)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 backdrop-blur-md ${selectedCategory === cat
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 ring-2 ring-primary-200/50'
                                            : 'bg-white/60 border border-white/60 text-gray-600 hover:border-primary-400/50 hover:text-primary-600 hover:bg-white/80'
                                            }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {cat}
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Side: Search & Sort */}
                    <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-4">
                        {/* Search Bar */}
                        <div className="relative w-full group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-4 py-3.5 rounded-xl border border-primary-200/80 bg-white/60 backdrop-blur-md text-gray-950 placeholder:text-gray-400 shadow-lg shadow-primary-500/20 focus:shadow-xl focus:shadow-primary-500/30 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:bg-white/90 transition-all text-sm font-medium outline-none"
                                placeholder="Search skills..."
                                value={searchQuery}
                                onChange={(e) => {
                                    if (e.target.value) searchParams.set('search', e.target.value);
                                    else searchParams.delete('search');
                                    setSearchParams(searchParams);
                                }}
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative w-full group">
                            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-3 py-3 shadow-sm group-hover:border-primary-300 group-hover:bg-white/80 transition-all w-full">
                                <ArrowDownUp size={16} className="text-gray-500 ml-1 group-hover:text-primary-500 transition-colors" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer w-full appearance-none"
                                    style={{ backgroundImage: 'none' }}
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>

            {/* Content Grid */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                {loading ? (
                    <MarketplaceSkeleton />
                ) : sortedSkills.length > 0 ? (
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8"
                    >
                        {sortedSkills.map(skill => (
                            <motion.div
                                key={skill._id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0 }
                                }}
                            >
                                <SkillCard skill={skill} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-20 bg-white/50 backdrop-blur-lg rounded-2xl border border-white/40 border-dashed flex flex-col items-center shadow-lg">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <Filter size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-950 mb-2">No skills found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">
                            Try adjusting your filters or search term to discover more.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
