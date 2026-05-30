'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

function notificationEmoji(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('list')) return '📋';
  if (t.includes('item') || t.includes('suggest')) return '✅';
  if (t.includes('like') || t.includes('save')) return '❤️';
  if (t.includes('comment')) return '💬';
  if (t.includes('follow')) return '👤';
  return '🔔';
}

function NotificationSkeleton() {
  return (
    <div className="space-y-2 px-2.5 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-2.5 rounded-xl border border-wibe p-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationIcon() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications?unreadOnly=false&limit=20');
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
        setFetchFailed(false);
      } else if (res.status >= 500) {
        setFetchFailed(true);
      }
    } catch {
      setFetchFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;

    fetchNotifications();

    pollRef.current = setInterval(() => {
      if (!fetchFailed) fetchNotifications();
    }, 60000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session?.user?.id, fetchFailed, fetchNotifications]);

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
    } catch {
      // ignore
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

  const openSheet = () => {
    setIsOpen(true);
    fetchNotifications();
  };

  const handleNotificationClick = (
    e: React.MouseEvent,
    notification: Notification
  ) => {
    if (!notification.read) {
      e.preventDefault();
      void markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (!session?.user) return null;

  const subtitle =
    unreadCount > 0
      ? `${unreadCount.toLocaleString('fa-IR')} اعلان خوانده‌نشده`
      : notifications.length > 0
        ? `${notifications.length.toLocaleString('fa-IR')} اعلان`
        : undefined;

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
        aria-label={`اعلان‌ها${unreadCount > 0 ? `، ${unreadCount} خوانده‌نشده` : ''}`}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount.toLocaleString('fa-IR')}
          </span>
        )}
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="اعلان‌ها"
        subtitle={subtitle}
        maxHeight="78vh"
        headerAction={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex h-9 items-center gap-1 rounded-lg px-2 wibe-caption font-medium text-primary transition-colors hover:bg-primary/5"
              aria-label="علامت‌گذاری همه به عنوان خوانده‌شده"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden min-[360px]:inline">همه خوانده</span>
            </button>
          ) : undefined
        }
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {fetchFailed && !isLoading && (
            <div className="mx-2.5 mb-2 flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
              <p className="wibe-caption text-wibe-secondary">بارگذاری ناموفق</p>
              <button
                type="button"
                onClick={() => fetchNotifications()}
                className="flex items-center gap-1 wibe-caption font-medium text-primary"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                تلاش مجدد
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,8px)]">
            {isLoading && notifications.length === 0 ? (
              <NotificationSkeleton />
            ) : notifications.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Bell className="h-7 w-7 text-wibe-secondary/60" strokeWidth={1.5} />
                </div>
                <p className="wibe-body font-medium text-foreground">اعلانی نداری</p>
                <p className="mt-1 wibe-caption text-wibe-secondary">
                  وقتی لیست یا پیشنهادت تایید شود اینجا می‌بینی
                </p>
              </div>
            ) : (
              <ul className="space-y-2 px-2.5 py-2" aria-label="لیست اعلان‌ها">
                {notifications.map((notification) => {
                  const rowClass = `flex gap-2.5 rounded-xl border p-3 transition-colors active:scale-[0.99] ${
                    !notification.read
                      ? 'border-primary/20 bg-primary/[0.04]'
                      : 'border-wibe bg-wibe-card'
                  }`;

                  const inner = (
                    <>
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                          !notification.read ? 'bg-primary/10' : 'bg-gray-100'
                        }`}
                        aria-hidden
                      >
                        {notificationEmoji(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={`line-clamp-1 wibe-small leading-snug ${
                              !notification.read ? 'font-bold text-foreground' : 'font-semibold text-foreground'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                              aria-label="خوانده‌نشده"
                            />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 wibe-caption leading-relaxed text-wibe-secondary">
                          {notification.message}
                        </p>
                        <p className="mt-1.5 wibe-caption text-wibe-secondary/70">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: faIR,
                          })}
                        </p>
                      </div>
                    </>
                  );

                  return (
                    <li key={notification.id}>
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          className={rowClass}
                          onClick={(e) => handleNotificationClick(e, notification)}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`${rowClass} w-full text-right`}
                          onClick={(e) => handleNotificationClick(e, notification)}
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
