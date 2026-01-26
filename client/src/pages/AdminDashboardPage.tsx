import { useEffect, useState } from 'react';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SEO title="Admin Dashboard" />
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto">
                {['stats', 'users', 'skills', 'bookings'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t as any)}
                        className={clsx(
                            "pb-4 px-2 text-sm font-medium capitalize whitespace-nowrap transition-colors",
                            tab === t
                                ? "border-b-2 border-primary-600 text-primary-600"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading data...</div>
            ) : (
                <>
                    {tab === 'stats' && stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 uppercase">Total Users</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h3>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Users size={24} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 uppercase">Total Skills</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalSkills}</h3>
                                </div>
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                    <Book size={24} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 uppercase">Total Bookings</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalBookings}</h3>
                                </div>
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                    <Activity size={24} />
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'users' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Trust Score</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {usersList.map((u) => (
                                        <tr key={u._id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {u.imageUrl ? (
                                                        <img src={u.imageUrl} className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                                                        <p className="text-xs text-gray-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 capitalize">{u.role}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-primary-600">{u.trustScore}</td>
                                            <td className="px-6 py-4">
                                                <span className={clsx("px-2 py-1 text-xs rounded-full font-medium uppercase",
                                                    u.isBanned ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                                )}>
                                                    {u.isBanned ? 'Banned' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleBanToggle(u._id, u.isBanned)}
                                                    className={clsx("p-2 rounded-lg transition-colors",
                                                        u.isBanned ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"
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
                                <div key={skill._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 line-clamp-1">{skill.title}</h4>
                                        <p className="text-xs text-primary-600 mb-1">{skill.category}</p>
                                        <p className="text-sm text-gray-500">
                                            Provider: {skill.provider?.firstName} {skill.provider?.lastName}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSkill(skill._id)}
                                        className="text-gray-400 hover:text-red-500 p-2 self-start"
                                        title="Delete Skill"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'bookings' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Skill</th>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Provider</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bookingsList.map((b) => (
                                        <tr key={b._id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {format(new Date(b.createdAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.skillTitle}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{b.studentName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{b.providerName}</td>
                                            <td className="px-6 py-4">
                                                <span className={clsx("px-2 py-0.5 text-xs rounded-full font-medium uppercase border",
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
                </>
            )}
        </div>
    );
}
