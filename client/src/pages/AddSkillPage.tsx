import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { createSkill } from '../lib/api';
import { BookOpen, DollarSign, Award, Tag, Languages, Clock } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '../components/SEO';

const CATEGORIES = ['Academic', 'Programming', 'Music', 'Language', 'Art', 'Other'];

export default function AddSkillPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        price: '',
        experience: 'Intermediate',
        language: '',
        duration: '60'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await createSkill({
                ...formData,
                price: Number(formData.price),
                duration: Number(formData.duration),
                providerId: user.id
            });
            navigate('/marketplace');
            toast.success('Skill published successfully!');
        } catch (error) {
            console.error('Failed to create skill:', error);
            toast.error('Failed to publish skill. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12 min-h-[calc(100vh-64px)] relative">
            <SEO title="Add New Skill" />

            {/* Background Glows */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-100/40 rounded-full blur-[100px] -z-10 pointer-events-none" />

            <div className="text-center mb-10">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-gray-900"
                >
                    Share Your <span className="text-primary-600">Skill</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-600 mt-2"
                >
                    Start earning by helping other students.
                </motion.p>
            </div>

            <motion.form
                variants={containerVariants}
                initial="hidden"
                animate="show"
                onSubmit={handleSubmit}
                className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-200/50 border border-white/60 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary-100"
            >
                <div className="p-8 space-y-6">

                    {/* Title */}
                    <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Skill Title</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                <BookOpen size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white hover:border-primary-300/70 shadow-sm"
                                placeholder="e.g. Python Programming"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </motion.div>

                    {/* Category & Price */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Tag size={18} />
                                </div>
                                <select
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 text-gray-900 outline-none cursor-pointer transition-all duration-200 focus:bg-white hover:border-primary-300/70 shadow-sm appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select a category</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <DollarSign size={18} />
                                </div>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white hover:border-primary-300/70 shadow-sm"
                                    placeholder="500"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Duration & Language */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Clock size={18} />
                                </div>
                                <input
                                    type="number"
                                    required
                                    min="5"
                                    step="15"
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white hover:border-primary-300/70 shadow-sm"
                                    placeholder="60"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Languages size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white hover:border-primary-300/70 shadow-sm"
                                    placeholder="e.g. English, Spanish"
                                    value={formData.language}
                                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Experience */}
                    <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                <Award size={18} />
                            </div>
                            <select
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 text-gray-900 outline-none cursor-pointer transition-all duration-200 focus:bg-white hover:border-primary-300/70 shadow-sm"
                                value={formData.experience}
                                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                            >
                                <option value="Beginner">Beginner (1-2 years)</option>
                                <option value="Intermediate">Intermediate (3-5 years)</option>
                                <option value="Expert">Expert (5+ years)</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Description */}
                    <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            required
                            rows={4}
                            className="block w-full p-3 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 text-gray-900 placeholder:text-gray-400 outline-none resize-none transition-all duration-200 focus:bg-white hover:border-primary-300/70 shadow-sm"
                            placeholder="Describe what you will teach and your teaching style..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </motion.div>

                </div>

                <div className="bg-gray-50/50 backdrop-blur-sm px-8 py-4 flex justify-end items-center gap-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="text-gray-600 hover:text-gray-900 font-bold transition-colors px-4 py-2 hover:bg-gray-200/50 rounded-xl text-sm"
                    >
                        Cancel
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="bg-primary-600 text-white px-8 py-2.5 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                    >
                        {loading ? 'Publishing...' : 'Publish Skill'}
                    </motion.button>
                </div>
            </motion.form>
        </div>
    );
}
