import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../services/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/admin/notifications').then((r) => setNotifications(r.data.data || [])).catch(() => {});
  }, []);

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b dark:border-gray-700 font-semibold text-sm">Notifications</div>
            {notifications.length ? notifications.map((n) => (
              <div key={n.id} className={`p-3 border-b dark:border-gray-800 text-sm ${!n.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                <p className="font-medium">{n.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
              </div>
            )) : (
              <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
