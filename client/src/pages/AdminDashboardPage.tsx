import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { getAdminStats, getAdminUsers, toggleUserBan, getAdminSkills, deleteAdminSkill, getAdminBookings } from '../lib/api';
import { Users, Book, Activity, AlertCircle, Ban, Trash2, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import SEO from '../components/SEO';

export default function AdminDashboardPage() {
    const { user } = useUser();
    const [tab, setTab] = useState<'stats' | 'users' | 'skills' | 'bookings'>('stats');
    const [stats, setStats] = useState<any>(null);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [skillsList, setSkillsList] = useState<any[]>([]);
    const [bookingsList, setBookingsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, tab]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (tab === 'stats') {
                const data = await getAdminStats(user!.id);
                setStats(data);
            } else if (tab === 'users') {
                const data = await getAdminUsers(user!.id);
                setUsersList(data);
            } else if (tab === 'skills') {
                const data = await getAdminSkills(user!.id);
                setSkillsList(data);
            } else if (tab === 'bookings') {
                const data = await getAdminBookings(user!.id);
                setBookingsList(data);
            }
        } catch (err: any) {
            // If 403, not admin
            if (err.response?.status === 403) {
                setError('Access Denied: You are not an administrator.');
            } else {
                setError('Failed to load data.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBanToggle = async (targetUserId: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;
        try {
            await toggleUserBan(user!.id, targetUserId, !currentStatus);
            fetchData(); // Refresh
            toast.success(`User ${!currentStatus ? 'banned' : 'unbanned'} successfully`);
        } catch (err) {
            toast.error('Action failed');
        }
    };

    const handleDeleteSkill = async (skillId: string) => {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        try {
            await deleteAdminSkill(user!.id, skillId);
            fetchData();
            toast.success('Skill deleted successfully');
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500">
                <AlertCircle size={48} className="mb-4" />
                <h1 className="text-2xl font-bold">{error}</h1>
                <p className="mt-2 text-gray-600 mb-6">Please contact support if you believe this is an error.</p>

                {/* Self-Healing Button for Development */}
                {/* Self-Healing Button for Development */}
                <button
                    onClick={async () => {
                        if (!user) return;
                        try {
                            // Call the special dev route
                            const { devMakeAdmin, devSyncUser } = await import('../lib/api');

                            // 1. Force Sync User (this creates the specific user in DB if missing)
                            await devSyncUser({
                                clerkId: user.id,
                                email: user.primaryEmailAddress?.emailAddress,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                imageUrl: user.imageUrl
                            });

                            // 2. Then Promote
                            await devMakeAdmin(user.id);

                            alert("Privileges updated! Please refresh the page.");
                            window.location.reload();
                        } catch (e) {
                            alert("Failed to auto-fix. Please check console.");
                            console.error(e);
                        }
                    }}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-bold"
                >
                    Sync & Grant Admin Access
                </button>
            </div>
        );
    }
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative min-h-screen">
            <SEO title="Admin Dashboard" />

            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/40 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply" />

            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-black text-gray-900 mb-8 tracking-tight"
            >
                Admin <span className="text-primary-600">Dashboard</span>
            </motion.h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200/60 mb-8 overflow-x-auto pb-1">
                {['stats', 'users', 'skills', 'bookings'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t as any)}
                        className={clsx(
                            "pb-4 px-4 text-sm font-bold capitalize whitespace-nowrap transition-all duration-300 relative",
                            tab === t
                                ? "text-primary-600"
                                : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        {t}
                        {tab === t && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400 font-medium animate-pulse">Loading dashboard data...</div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {tab === 'stats' && stats && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <motion.div whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg shadow-gray-100/50 border border-white/60 flex items-center justify-between group">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Users</p>
                                        <h3 className="text-4xl font-black text-gray-900 mt-1">{stats.totalUsers}</h3>
                                    </div>
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                        <Users size={28} />
                                    </div>
                                </motion.div>
                                <motion.div whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg shadow-gray-100/50 border border-white/60 flex items-center justify-between group">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Skills</p>
                                        <h3 className="text-4xl font-black text-gray-900 mt-1">{stats.totalSkills}</h3>
                                    </div>
                                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                        <Book size={28} />
                                    </div>
                                </motion.div>
                                <motion.div whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg shadow-gray-100/50 border border-white/60 flex items-center justify-between group">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Bookings</p>
                                        <h3 className="text-4xl font-black text-gray-900 mt-1">{stats.totalBookings}</h3>
                                    </div>
                                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                        <Activity size={28} />
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {tab === 'users' && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-100/50 border border-white/60 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-bold tracking-wider border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Trust Score</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50">
                                        {usersList.map((u) => (
                                            <tr key={u._id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {u.imageUrl ? (
                                                            <img src={u.imageUrl} className="w-10 h-10 rounded-xl object-cover shadow-sm bg-gray-100" />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl" />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{u.firstName} {u.lastName}</p>
                                                            <p className="text-xs text-gray-500 font-medium">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={clsx("px-2.5 py-1 rounded-lg text-xs font-bold capitalize",
                                                        u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                                                    )}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary-500 rounded-full"
                                                                style={{ width: `${Math.min(u.trustScore, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700">{u.trustScore}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={clsx("px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wide",
                                                        u.isBanned ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                    )}>
                                                        {u.isBanned ? 'Banned' : 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleBanToggle(u._id, u.isBanned)}
                                                        className={clsx("p-2 rounded-lg transition-all hover:scale-110",
                                                            u.isBanned ? "text-emerald-500 hover:bg-emerald-50" : "text-rose-400 hover:bg-rose-50 hover:text-rose-500"
                                                        )}
                                                        title={u.isBanned ? "Unban User" : "Ban User"}
                                                    >
                                                        {u.isBanned ? <CheckCircle size={18} /> : <Ban size={18} />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {tab === 'skills' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {skillsList.map((skill) => (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        whileHover={{ y: -2 }}
                                        key={skill._id}
                                        className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-all flex justify-between gap-4 group"
                                    >
                                        <div>
                                            <h4 className="font-bold text-gray-900 line-clamp-1">{skill.title}</h4>
                                            <p className="text-xs font-bold text-primary-600 mb-1">{skill.category}</p>
                                            <p className="text-xs text-gray-500 font-medium">
                                                by {skill.provider?.firstName} {skill.provider?.lastName}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSkill(skill._id)}
                                            className="text-gray-300 hover:text-red-500 p-2 self-start rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Skill"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {tab === 'bookings' && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-100/50 border border-white/60 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-bold tracking-wider border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Skill</th>
                                            <th className="px-6 py-4">Student</th>
                                            <th className="px-6 py-4">Provider</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50">
                                        {bookingsList.map((b) => (
                                            <tr key={b._id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                    {format(new Date(b.createdAt), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{b.skillTitle}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{b.studentName}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{b.providerName}</td>
                                                <td className="px-6 py-4">
                                                    <span className={clsx("px-2.5 py-1 text-xs rounded-lg font-bold uppercase tracking-wider border",
                                                        b.status === 'completed' ? "bg-green-50 text-green-700 border-green-200" :
                                                            b.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-200" :
                                                                "bg-blue-50 text-blue-700 border-blue-200"
                                                    )}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
