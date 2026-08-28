import React from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Ticket, 
  PhoneCall, 
  MessageSquareWarning, 
  Sparkles,
  Clock
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">NOTIFICATIONS CENTER</h1>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Real-time automated alerts for Outpass reviews, complaint responses, and Call Booth dispatches.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-600 border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No notifications in your inbox.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                notif.read
                  ? 'bg-[#F5F7FB]/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  : 'bg-slate-50/60 border-brand-500/40 text-slate-900 dark:text-white shadow-md ring-1 ring-brand-500/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${notif.read ? 'bg-slate-600' : 'bg-brand-400 animate-pulse'}`} />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 ml-4 leading-relaxed">{notif.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
