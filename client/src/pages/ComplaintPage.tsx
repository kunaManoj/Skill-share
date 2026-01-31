import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { createComplaint, getUserComplaints } from '../lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, History, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function ComplaintPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myComplaints, setMyComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && activeTab === 'list') {
            fetchComplaints();
        }
    }, [user, activeTab]);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const data = await getUserComplaints(user!.id);
            setMyComplaints(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return toast.error('You must be logged in');

        setIsSubmitting(true);
        try {
            await createComplaint({
                userId: user.id,
                userEmail: user.primaryEmailAddress?.emailAddress,
                userName: user.fullName || user.firstName || 'User',
                title,
                description
            });
            toast.success('Complaint submitted successfully');
            setTitle('');
            setDescription('');
            setActiveTab('list');
        } catch (err) {
            toast.error('Failed to submit complaint');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 relative min-h-[80vh]">
            <SEO title="Support & Complaints" />

            {/* Background elements */}


            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 flex items-center justify-center gap-3">
                    <AlertCircle className="text-red-500" size={32} /> Support Center
                </h1>
                <p className="text-[var(--text-secondary)] font-medium">We're here to help resolve any issues.</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-[var(--bg-glass-subtle)] p-1 rounded-xl w-full max-w-sm mx-auto mb-8">
                <button
                    onClick={() => setActiveTab('new')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all",
                        activeTab === 'new' ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                >
                    <Send size={16} /> New Report
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all",
                        activeTab === 'list' ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                >
                    <History size={16} /> My Reports
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'new' ? (
                    <motion.div
                        key="new"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] p-8 rounded-3xl shadow-xl shadow-[var(--border-color)]"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Subject</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="Briefly describe the issue..."
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all font-medium placeholder:text-[var(--text-secondary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    rows={6}
                                    placeholder="Please provide details about what happened..."
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all resize-none font-medium placeholder:text-[var(--text-secondary)]"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        'Submitting...'
                                    ) : (
                                        <>
                                            Submit Report <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        {loading ? (
                            <div className="text-center py-12 text-[var(--text-secondary)]">Loading complaints...</div>
                        ) : myComplaints.length === 0 ? (
                            <div className="text-center py-12 bg-[var(--bg-glass-subtle)] rounded-3xl border border-dashed border-[var(--border-color)]">
                                <CheckCircle size={48} className="mx-auto text-[var(--text-secondary)] mb-3" />
                                <p className="text-[var(--text-secondary)] font-medium">No complaints found</p>
                            </div>
                        ) : (
                            myComplaints.map((c) => (
                                <div key={c._id} className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-[var(--text-primary)]">{c.title}</h3>
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                            c.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                        )}>
                                            {c.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">{c.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium pt-3 border-t border-[var(--border-color)]">
                                        <Clock size={14} />
                                        {format(new Date(c.createdAt), 'MMM d, yyyy • h:mm a')}
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
