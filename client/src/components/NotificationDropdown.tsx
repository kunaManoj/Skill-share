import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../lib/api'; // We'll add getNotifications to api.ts shortly
import { X, Bell, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function NotificationDropdown({ onClose }: { onClose: () => void }) {
    const { user } = useUser();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            // Need to add this API function
            api.get(`/notifications/${user.id}`).then((res: any) => {
                setNotifications(res.data);
            }).catch(console.error).finally(() => setLoading(false));
        }
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-glass-subtle)]">
                <div className="flex items-center gap-2">
                    <Bell size={16} className="text-primary-600" />
                    <h3 className="font-bold text-[var(--text-primary)] text-sm">Notifications</h3>
                </div>
                <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-glass-subtle)] transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[100px] bg-[var(--bg-card)]">
                {loading ? (
                    <div className="p-8 text-center text-[var(--text-secondary)] text-xs">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-secondary)] text-xs flex flex-col items-center gap-2">
                        <Bell size={24} className="opacity-20" />
                        No notifications yet
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border-color)]">
                        {notifications.map((notif) => (
                            <div
                                key={notif._id}
                                className={clsx(
                                    "p-4 hover:bg-[var(--bg-glass-subtle)] transition-all relative group border-l-2 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]",
                                    !notif.isRead ? "bg-primary-500/10 border-primary-500" : "border-transparent"
                                )}
                                onClick={() => !notif.isRead && markAsRead(notif._id)}
                            >
                                <div className="flex gap-3">
                                    <div className={clsx(
                                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                        !notif.isRead ? "bg-primary-500" : "bg-[var(--text-secondary)] opacity-50"
                                    )} />
                                    <div className="flex-1">
                                        <h4 className={clsx("text-xs font-bold mb-0.5", !notif.isRead ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                                            {notif.title}
                                        </h4>
                                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed theme-dependent-gray">
                                            {notif.message}
                                        </p>

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-[var(--text-secondary)] opacity-70 font-medium">
                                                {format(new Date(notif.createdAt), 'MMM d, p')}
                                            </span>
                                            {notif.link && (
                                                <Link
                                                    to={notif.link}
                                                    onClick={onClose}
                                                    className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-500/10 hover:bg-primary-500/20 px-2 py-1 rounded-md transition-colors"
                                                >
                                                    View <ExternalLink size={10} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
