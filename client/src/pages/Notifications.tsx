import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { Bell, BellOff, CheckCheck, Package, MessageCircle, Star, AlertTriangle } from 'lucide-react';

const notifIcons: Record<string, React.FC<any>> = {
  RENTAL_REQUEST: Package,
  REQUEST_ACCEPTED: CheckCheck,
  REQUEST_REJECTED: BellOff,
  NEW_MESSAGE: MessageCircle,
  RENTAL_REMINDER: Bell,
  RENTAL_COMPLETED: CheckCheck,
  NEW_REVIEW: Star,
  LISTING_REMOVED: AlertTriangle,
  ACCOUNT_STATUS: AlertTriangle,
};

const notifColors: Record<string, string> = {
  RENTAL_REQUEST: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  REQUEST_ACCEPTED: 'text-green-500 bg-green-50 dark:bg-green-950/30',
  REQUEST_REJECTED: 'text-red-500 bg-red-50 dark:bg-red-950/30',
  NEW_MESSAGE: 'text-primary-500 bg-primary-50 dark:bg-primary-950/30',
  RENTAL_REMINDER: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  RENTAL_COMPLETED: 'text-green-500 bg-green-50 dark:bg-green-950/30',
  NEW_REVIEW: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  LISTING_REMOVED: 'text-red-500 bg-red-50 dark:bg-red-950/30',
  ACCOUNT_STATUS: 'text-red-500 bg-red-50 dark:bg-red-950/30',
};

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationService.getNotifications();
        if (res.data?.success) setNotifications(res.data.notifications);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-outfit text-gray-900 dark:text-gray-100">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center space-x-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="h-10 w-10 bg-gray-100 dark:bg-slate-800 rounded-2xl flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-2/3"></div>
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const IconComponent = notifIcons[notif.type] || Bell;
            const iconStyle = notifColors[notif.type] || 'text-gray-500 bg-gray-100 dark:bg-slate-800';

            return (
              <div
                key={notif._id}
                className={`flex items-start space-x-4 p-4 rounded-2xl border transition-all ${
                  notif.isRead
                    ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'
                    : 'bg-primary-50/50 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/30'
                }`}
              >
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-normal">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-2"></div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Bell className="h-16 w-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
          <p className="font-bold text-gray-500 dark:text-gray-400">You're all caught up!</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No notifications to show.</p>
        </div>
      )}
    </div>
  );
};
export default Notifications;
