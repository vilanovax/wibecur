'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, RefreshCw, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { useRefetchOnVisible } from '@/lib/hooks/useRefetchOnVisible';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationPreferences {
  allowBookmarkListNotifications: boolean;
  allowCommentNotifications: boolean;
}

function notificationEmoji(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('list_item')) return '📋';
  if (t.includes('list')) return '📋';
  if (t.includes('item') || t.includes('suggest')) return '✅';
  if (t.includes('like') || t.includes('save')) return '❤️';
  if (t.includes('comment')) return '💬';
  if (t.includes('follow') || t.includes('collab')) return '👤';
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

function PreferenceToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2.5">
      <span className="min-w-0 text-right">
        <span className="block wibe-small font-medium text-foreground">{label}</span>
        {description && (
          <span className="mt-0.5 block wibe-caption leading-relaxed text-wibe-secondary">
            {description}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 rounded border-wibe text-primary focus-visible:ring-primary/30"
      />
    </label>
  );
}

export function useNotifications(enabled = true) {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    allowBookmarkListNotifications: true,
    allowCommentNotifications: true,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive = enabled && Boolean(session?.user);

  const fetchNotifications = useCallback(async (options?: { background?: boolean }) => {
    if (!session?.user) return;

    if (!options?.background) {
      setIsLoading(true);
    }
    try {
      const res = await fetch('/api/notifications?unreadOnly=false&limit=30');
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
        if (data.data.preferences) {
          setPreferences(data.data.preferences);
        }
        setFetchFailed(false);
      } else if (res.status >= 500) {
        setFetchFailed(true);
      }
    } catch {
      setFetchFailed(true);
    } finally {
      if (!options?.background) {
        setIsLoading(false);
      }
    }
  }, [session?.user]);

  useEffect(() => {
    if (!isActive) return;

    void fetchNotifications();

    const poll = () => {
      if (fetchFailed || document.visibilityState !== 'visible') return;
      void fetchNotifications({ background: true });
    };

    pollRef.current = setInterval(poll, 60000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isActive, session?.user?.id, fetchFailed, fetchNotifications]);

  useRefetchOnVisible(fetchNotifications, isActive);

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

  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (res.ok) {
        setNotifications((prev) => {
          const target = prev.find((n) => n.id === notificationId);
          if (target && !target.read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n.id !== notificationId);
        });
      }
    } catch {
      // ignore
    }
  };

  const deleteReadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => !n.read));
      }
    } catch {
      // ignore
    }
  };

  const updateBookmarkPref = async (enabled: boolean) => {
    const previous = preferences.allowBookmarkListNotifications;
    setPreferences((prev) => ({ ...prev, allowBookmarkListNotifications: enabled }));
    setIsSavingPref(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowBookmarkListNotifications: enabled }),
      });
      const data = await res.json();
      if (!data.success) {
        setPreferences((prev) => ({ ...prev, allowBookmarkListNotifications: previous }));
      }
    } catch {
      setPreferences((prev) => ({ ...prev, allowBookmarkListNotifications: previous }));
    } finally {
      setIsSavingPref(false);
    }
  };

  const openNotifications = () => {
    setIsOpen(true);
    fetchNotifications();
  };

  const closeNotifications = () => setIsOpen(false);

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

  const readCount = notifications.filter((n) => n.read).length;
  const subtitle =
    unreadCount > 0
      ? `${unreadCount.toLocaleString('fa-IR')} اعلان خوانده‌نشده`
      : notifications.length > 0
        ? `${notifications.length.toLocaleString('fa-IR')} اعلان`
        : undefined;

  return {
    isActive,
    unreadCount,
    isOpen,
    isLoading,
    isSavingPref,
    fetchFailed,
    notifications,
    preferences,
    readCount,
    subtitle,
    openNotifications,
    closeNotifications,
    fetchNotifications,
    markAllAsRead,
    deleteReadNotifications,
    deleteNotification,
    handleNotificationClick,
    updateBookmarkPref,
  };
}

export function NotificationSheet({
  center,
}: {
  center: ReturnType<typeof useNotifications>;
}) {
  if (!center.isActive) return null;

  const {
    isOpen,
    closeNotifications,
    subtitle,
    unreadCount,
    markAllAsRead,
    fetchFailed,
    isLoading,
    fetchNotifications,
    notifications,
    readCount,
    deleteReadNotifications,
    handleNotificationClick,
    deleteNotification,
    preferences,
    isSavingPref,
    updateBookmarkPref,
  } = center;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={closeNotifications}
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

        <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,8px)]">
          {isLoading && notifications.length === 0 ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Bell className="h-7 w-7 text-wibe-secondary/60" strokeWidth={1.5} />
              </div>
              <p className="wibe-body font-medium text-foreground">اعلانی نداری</p>
              <p className="mt-1 wibe-caption text-wibe-secondary">
                وقتی لیست ذخیره‌شده به‌روز شود یا پیشنهادت تایید شود اینجا می‌بینی
              </p>
            </div>
          ) : (
            <>
              {readCount > 0 && (
                <div className="flex justify-end px-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => void deleteReadNotifications()}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 wibe-caption font-medium text-wibe-secondary transition-colors hover:bg-gray-100 hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف خوانده‌شده‌ها
                  </button>
                </div>
              )}
              <ul className="space-y-2 px-2.5 py-2" aria-label="لیست اعلان‌ها">
                {notifications.map((notification) => {
                  const rowClass = `flex items-start gap-2 rounded-xl border p-3 transition-colors active:scale-[0.99] ${
                    !notification.read
                      ? 'border-primary/20 bg-primary/[0.04]'
                      : 'border-wibe bg-wibe-card'
                  }`;

                  return (
                    <li key={notification.id}>
                      <div className={rowClass}>
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 gap-2.5 text-right"
                          onClick={(e) => handleNotificationClick(e, notification)}
                        >
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
                                  !notification.read
                                    ? 'font-bold text-foreground'
                                    : 'font-semibold text-foreground'
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
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteNotification(notification.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-lg text-wibe-secondary transition-colors hover:bg-gray-100 hover:text-foreground"
                          aria-label="حذف اعلان"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <div className="mx-2.5 mt-2 rounded-2xl border border-wibe bg-wibe-card px-3">
            <p className="py-2.5 wibe-caption font-semibold uppercase tracking-wide text-wibe-secondary">
              تنظیمات اعلان
            </p>
            <PreferenceToggle
              label="به‌روزرسانی لیست‌های ذخیره‌شده"
              description="مثلاً «۳ رستوران به لیست X اضافه شد»"
              checked={preferences.allowBookmarkListNotifications}
              disabled={isSavingPref}
              onChange={(value) => void updateBookmarkPref(value)}
            />
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

export function NotificationUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  const label = count > 9 ? '9+' : count.toLocaleString('fa-IR');

  return (
    <span
      className="pointer-events-none absolute -top-0.5 -left-0.5 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] ring-2 ring-[var(--color-bg,#fff)]"
      aria-hidden
    >
      {label}
    </span>
  );
}
