import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSkills } from '../lib/api';
import SkillCard from '../components/SkillCard';
import { Search, Filter, SlidersHorizontal, ArrowDownUp } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { MarketplaceSkeleton } from '../components/Skeleton';
import SEO from '../components/SEO';
import { useUser } from '@clerk/clerk-react';

const CATEGORIES = ['All', 'Academic', 'Programming', 'Music', 'Language', 'Art', 'Other'];
const SORT_OPTIONS = [
    { label: 'Recommended', value: 'recommended' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Highest Rated', value: 'rating_desc' }
];

export default function MarketplacePage() {
    const { user } = useUser();
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
        const newParams = new URLSearchParams(searchParams);
        if (category === 'All') {
            newParams.delete('category');
        } else {
            newParams.set('category', category);
        }
        setSearchParams(newParams);
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
                className="bg-[var(--bg-glass)] backdrop-blur-xl border-b border-[var(--border-color)] relative overflow-hidden card-shadow"
            >
                {/* Ambient Glows */}


                <div className="w-full px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">

                    {/* Left Side: Title & Categories */}
                    <div className="flex-1 space-y-6 w-full">
                        <div className="space-y-2 max-w-2xl section-underline">
                            <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight">
                                Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 animate-shimmer bg-[length:200%_auto]">Skills</span>
                            </h1>
                            <p className="text-base text-[var(--text-secondary)] font-medium">
                                Connect with the most talented peers on campus.
                            </p>
                        </div>

                        {/* Categories Chips */}
                        <div className="flex items-center gap-2 overflow-x-auto p-1 py-2 no-scrollbar">
                            <div className="flex items-center gap-1.5 pr-3 border-r border-[var(--border-color)] mr-1 shrink-0">
                                <SlidersHorizontal size={14} className="text-[var(--text-secondary)]" />
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Category</span>
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
                                            : 'bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-primary-400/50 hover:text-primary-600 hover:bg-[var(--bg-glass)]'
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
                                className="block w-full pl-10 pr-4 py-3.5 rounded-xl border border-primary-200/80 bg-[var(--bg-glass-subtle)] backdrop-blur-md text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] shadow-lg shadow-primary-500/20 focus:shadow-xl focus:shadow-primary-500/30 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:bg-[var(--bg-glass)] transition-all text-sm font-medium outline-none"
                                placeholder="Search skills..."
                                value={searchQuery}
                                onChange={(e) => {
                                    const newParams = new URLSearchParams(searchParams);
                                    if (e.target.value) newParams.set('search', e.target.value);
                                    else newParams.delete('search');
                                    setSearchParams(newParams);
                                }}
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative w-full group">
                            <div className="flex items-center gap-2 bg-[var(--bg-glass-subtle)] backdrop-blur-md border border-[var(--border-color)] rounded-xl px-3 py-3 shadow-sm group-hover:border-primary-300 group-hover:bg-[var(--bg-glass)] transition-all w-full">
                                <ArrowDownUp size={16} className="text-gray-500 ml-1 group-hover:text-primary-500 transition-colors" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none cursor-pointer w-full appearance-none"
                                    style={{ backgroundImage: 'none' }}
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content Grid */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                {/* View Toggles */}
                {user && (
                    <div className="mb-6 flex space-x-6 border-b border-[var(--border-color)]">
                        <button
                            className={`py-2 px-1 text-sm font-bold border-b-2 transition-colors duration-200 ${searchParams.get('view') !== 'my-skills'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.delete('view');
                                setSearchParams(newParams);
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <Search size={16} /> Marketplace
                            </span>
                        </button>
                        <button
                            className={`py-2 px-1 text-sm font-bold border-b-2 transition-colors duration-200 ${searchParams.get('view') === 'my-skills'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.set('view', 'my-skills');
                                setSearchParams(newParams);
                            }}
                        >
                            My Listings
                        </button>
                    </div>
                )}

                {loading ? (
                    <MarketplaceSkeleton />
                ) : (
                    <SkillsGrid
                        key={searchParams.get('view') || 'marketplace'}
                        skills={sortedSkills}
                        view={searchParams.get('view') || 'marketplace'}
                        currentUser={user}
                    />
                )}
            </div>
        </div>
    );
}

function SkillsGrid({ skills, view, currentUser }: { skills: any[], view: string, currentUser: any }) {
    // Filter skills based on view
    const displayedSkills = skills.filter(skill => {
        if (!currentUser) return true; // If no user, show all skills (marketplace view)
        const isOwner = skill.providerId === currentUser.id;

        if (view === 'my-skills') {
            return isOwner;
        } else {
            return !isOwner; // In marketplace view, hide current user's skills
        }
    });

    if (displayedSkills.length === 0) {
        return (
            <div className="text-center py-20 bg-[var(--bg-glass-subtle)] backdrop-blur-lg rounded-2xl border border-[var(--border-color)] border-dashed flex flex-col items-center shadow-lg">
                <div className="w-16 h-16 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
                    <Filter size={32} className="text-[var(--text-secondary)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                    {view === 'my-skills' ? 'No listings found' : 'No skills found'}
                </h3>
                <p className="text-[var(--text-secondary)] max-w-xs mx-auto text-sm font-medium">
                    {view === 'my-skills'
                        ? "You haven't listed any skills yet."
                        : "Try adjusting your filters or check back later."}
                </p>
                {view === 'my-skills' && (
                    <Link to="/add-skill" className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-colors">
                        Create Listing
                    </Link>
                )}
            </div>
        );
    }

    return (
        <motion.div
            key={view}
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
            {displayedSkills.map(skill => (
                <motion.div
                    key={skill._id}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                    }}
                >
                    <SkillCard skill={skill} isOwner={view === 'my-skills'} />
                </motion.div>
            ))}
        </motion.div>
    );
}
