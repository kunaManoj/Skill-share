import { useEffect, useState } from 'react';
import { getSkills } from '../lib/api';
import SkillCard from '../components/SkillCard';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MarketplaceSkeleton } from '../components/Skeleton';
import SEO from '../components/SEO';

const CATEGORIES = ['All', 'Academic', 'Programming', 'Music', 'Language', 'Art', 'Other'];

export default function MarketplacePage() {
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

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

    return (
        <div className="min-h-[calc(100vh-64px)] pb-20">
            <SEO
                title={selectedCategory !== 'All' ? `${selectedCategory} Skills` : 'Marketplace'}
                description="Browse and book skills from students on campus."
            />

            {/* Hero Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                            <h1 className="text-3xl md:text-5xl font-black text-gray-950 tracking-tight">
                                Explore <span className="text-primary-600">Skills</span>
                            </h1>
                            <p className="text-base text-gray-600 font-medium">
                                Connect with the most talented peers on campus.
                            </p>
                        </div>

                        <div className="relative w-full md:w-[320px]">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-950 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm font-medium outline-none"
                                placeholder="Search skills..."
                                value={searchQuery}
                                onChange={(e) => {
                                    if (e.target.value) searchParams.set('search', e.target.value);
                                    else searchParams.delete('search');
                                    setSearchParams(searchParams);
                                }}
                            />
                        </div>
                    </div>

                    {/* Categories Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto mt-8 pb-2 no-scrollbar">
                        <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200 mr-1 shrink-0">
                            <SlidersHorizontal size={14} className="text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Filter</span>
                        </div>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${selectedCategory === cat
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-500 hover:text-primary-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
                {loading ? (
                    <MarketplaceSkeleton />
                ) : skills.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                        {skills.map(skill => (
                            <SkillCard key={skill._id} skill={skill} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center">
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
