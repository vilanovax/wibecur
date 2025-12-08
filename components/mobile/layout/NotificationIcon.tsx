'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Link from 'next/link';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationIcon() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications?unreadOnly=false&limit=20');
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        aria-label="پیام‌ها"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile BottomSheet for notifications */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="پیام‌ها"
        maxHeight="80vh"
      >
        <div className="flex flex-col h-full">
          {/* Header Actions */}
          {unreadCount > 0 && (
            <div className="px-6 py-3 border-b border-gray-200 flex justify-end">
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                همه را خوانده شده
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">پیامی وجود ندارد</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const contentClassName = `block p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : 'bg-white'
                  }`;
                  
                  const content = (
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notification.read ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-base mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: faIR,
                          })}
                        </p>
                      </div>
                    </div>
                  );

                  const handleClick = (e: React.MouseEvent) => {
                    if (!notification.read) {
                      e.preventDefault();
                      markAsRead(notification.id);
                      if (notification.link) {
                        setTimeout(() => {
                          window.location.href = notification.link!;
                        }, 200);
                      }
                    }
                    setIsOpen(false);
                  };

                  return notification.link ? (
                    <Link
                      key={notification.id}
                      href={notification.link}
                      className={contentClassName}
                      onClick={handleClick}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={notification.id}
                      className={contentClassName}
                      onClick={handleClick}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

