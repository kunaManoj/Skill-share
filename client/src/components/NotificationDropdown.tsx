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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <Bell size={16} className="text-primary-600" />
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[100px] bg-white">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-xs">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                        <Bell size={24} className="opacity-20" />
                        No notifications yet
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                            <div
                                key={notif._id}
                                className={clsx(
                                    "p-4 hover:bg-gray-50 transition-colors relative group",
                                    !notif.isRead && "bg-blue-50/30"
                                )}
                                onClick={() => !notif.isRead && markAsRead(notif._id)}
                            >
                                <div className="flex gap-3">
                                    <div className={clsx(
                                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                        !notif.isRead ? "bg-primary-500" : "bg-gray-200"
                                    )} />
                                    <div className="flex-1">
                                        <h4 className={clsx("text-xs font-bold mb-0.5", !notif.isRead ? "text-gray-900" : "text-gray-600")}>
                                            {notif.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 leading-relaxed theme-dependent-gray">
                                            {notif.message}
                                        </p>

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {format(new Date(notif.createdAt), 'MMM d, p')}
                                            </span>
                                            {notif.link && (
                                                <Link
                                                    to={notif.link}
                                                    onClick={onClose}
                                                    className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-md transition-colors"
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
