import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../lib/api';
import { Loader2, Bell, CheckCircle, Clock, CreditCard, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        if (notif.link) navigate(notif.link);
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
        <div className="max-w-3xl mx-auto px-6 py-10 min-h-[calc(100vh-64px)]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 font-medium">Updates and reminders</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Bell className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-gray-900">No notifications yet</h3>
                    <p className="text-gray-500 text-sm">We'll let you know when something important happens.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className={clsx(
                                "group bg-white p-5 rounded-2xl border transition-all duration-200 flex gap-4 cursor-pointer hover:shadow-md",
                                notif.isRead ? "border-gray-100" : "border-primary-100 bg-primary-50/10"
                            )}
                        >
                            <div className={clsx(
                                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                                notif.isRead ? "bg-gray-50" : "bg-white shadow-sm border border-gray-100"
                            )}>
                                {getIcon(notif.type)}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className={clsx("font-bold text-gray-900", !notif.isRead && "text-primary-900")}>
                                        {notif.title}
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap mt-1">
                                        {format(new Date(notif.createdAt), 'MMM d, p')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                    {notif.message}
                                </p>

                                {/* Link removed as per request, whole card is now clickable if needed, or just informative */}

                            </div>

                            {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
