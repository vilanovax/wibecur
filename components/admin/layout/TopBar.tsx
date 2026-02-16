'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import RoleBadge from '@/components/auth/RoleBadge';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export default function TopBar() {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const res = await fetch('/api/notifications?unreadOnly=false&limit=20');
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications ?? []);
        setUnreadCount(json.data.unreadCount ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showNotifications) fetchNotifications();
  }, [showNotifications, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در پنل مدیریت..."
              className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 group"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              {unreadCount > 0 && (
                <span className="absolute top-1 left-1 min-w-[8px] h-2 px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 max-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">نوتیفیکیشن‌ها</h3>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary-dark"
                    >
                      همه را خواندم
                    </button>
                  )}
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                  {notificationsLoading ? (
                    <p className="text-sm text-gray-500">در حال بارگذاری...</p>
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">پیامی نیست.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id}>
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => { setShowNotifications(false); if (!n.read) markAsRead(n.id); }}
                            className={`block p-3 rounded-lg text-right ${n.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100'}`}
                          >
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: faIR })}
                            </p>
                          </Link>
                        ) : (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => { if (!n.read) markAsRead(n.id); }}
                            onKeyDown={(e) => e.key === 'Enter' && (n.read || markAsRead(n.id))}
                            className={`p-3 rounded-lg text-right cursor-default ${n.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100'}`}
                          >
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: faIR })}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold">
                ا
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || session?.user?.email || 'ادمین'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span>نقش:</span>
                    <RoleBadge />
                  </p>
                </div>
              </div>
              <User className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </button>
            {showProfileMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors">
                  <User className="w-4 h-4" />
                  <span>پروفایل</span>
                </button>
                <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>تنظیمات</span>
                </button>
                <div className="my-2 border-t border-gray-200"></div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
