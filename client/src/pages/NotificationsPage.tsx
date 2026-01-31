import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { api } from '../lib/api';
import { Loader2, Bell, CheckCircle, Clock, CreditCard, Calendar, BellOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get(`/notifications/${user?.id}`);
            setNotifications(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleNotificationClick = (notif: any) => {
        if (!notif.isRead) markAsRead(notif._id);

        if (notif.type === 'payment') {
            navigate('/wallet');
        } else if (notif.type === 'booking') {
            navigate('/bookings');
        } else if (notif.link) {
            navigate(notif.link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking': return <Calendar size={20} className="text-blue-600" />;
            case 'payment': return <CreditCard size={20} className="text-emerald-600" />;
            case 'system': return <CheckCircle size={20} className="text-purple-600" />;
            case 'reminder': return <Clock size={20} className="text-amber-600" />;
            default: return <Bell size={20} className="text-gray-600" />;
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] pb-20">
            {/* Header */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] mb-6 card-shadow">
                <div className="w-full px-6 xl:px-12 py-8 flex items-center justify-between">
                    <div className="section-underline">
                        <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </h1>
                        <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-widest uppercase mt-1">Updates & Alerts</p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={() => {
                                notifications.forEach(n => {
                                    if (!n.isRead) markAsRead(n._id);
                                });
                                toast.success('All notifications marked as read');
                            }}
                            className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-500/10 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-primary-500/20"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {/* Ambient Background */}


            <div className="w-full px-6 xl:px-12 max-w-4xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary-600" size={32} />
                    </div>
                ) : notifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 bg-[var(--bg-glass-subtle)] backdrop-blur-sm rounded-2xl border border-dashed border-[var(--border-color)] flex flex-col items-center"
                    >
                        <BellOff size={48} className="text-[var(--text-secondary)] mb-4" />
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No notifications yet</h3>
                        <p className="text-[var(--text-secondary)] text-sm">We'll let you know when something important happens.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        className="space-y-4"
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
                    >
                        {notifications.map((notif) => (
                            <motion.div
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                variants={{
                                    hidden: { opacity: 0, x: -20 },
                                    show: { opacity: 1, x: 0 }
                                }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={clsx(
                                    "relative bg-[var(--bg-card)] backdrop-blur-sm rounded-2xl border p-5 flex gap-4 transition-all duration-200 cursor-pointer group",
                                    "border-primary-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] hover:border-primary-500/50",
                                    notif.isRead && "opacity-90"
                                )}
                            >
                                {!notif.isRead && (
                                    <div className="absolute top-5 right-5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                )}

                                <div className={clsx(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors border shadow-sm",
                                    "bg-primary-500/10 border-primary-500/20 text-primary-600 group-hover:scale-110 duration-300"
                                )}>
                                    {getIcon(notif.type)}
                                </div>

                                <div className="flex-1 pr-4">
                                    <h4 className={clsx("text-sm font-bold mb-1 group-hover:text-primary-600 transition-colors",
                                        notif.isRead ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"
                                    )}>
                                        {notif.title}
                                    </h4>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                                        {notif.message}
                                    </p>
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] opacity-70 uppercase tracking-wider mt-3 group-hover:text-primary-400 transition-colors">
                                        {format(new Date(notif.createdAt), 'MMM d, p')}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
