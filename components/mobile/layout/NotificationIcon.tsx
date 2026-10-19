'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Ban,
  Bell,
  CheckCheck,
  CircleCheck,
  CircleX,
  ListPlus,
  MessageCircle,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/format-relative-time';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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

function notificationMark(type: string): { Icon: LucideIcon; className: string } {
  const t = type.toLowerCase();
  if (t.includes('comment_banned') || t.includes('comment_restricted')) {
    return { Icon: Ban, className: 'bg-destructive/10 text-destructive' };
  }
  if (t.includes('comment_unrestricted')) {
    return { Icon: CircleCheck, className: 'bg-success/10 text-success' };
  }
  if (t.includes('rejected') || t.includes('deleted')) {
    return { Icon: CircleX, className: 'bg-destructive/10 text-destructive' };
  }
  if (t.includes('approved')) {
    return { Icon: CircleCheck, className: 'bg-success/10 text-success' };
  }
  if (t.includes('updated')) {
    return { Icon: Pencil, className: 'bg-muted text-foreground' };
  }
  if (t.includes('collab') || t.includes('follow')) {
    return { Icon: Users, className: 'bg-muted text-foreground' };
  }
  if (t.includes('list')) {
    return { Icon: ListPlus, className: 'bg-muted text-foreground' };
  }
  if (t.includes('comment')) {
    return { Icon: MessageCircle, className: 'bg-muted text-foreground' };
  }
  return { Icon: Bell, className: 'bg-muted text-muted-foreground' };
}

function NotificationGlyph({ type }: { type: string }) {
  const { Icon, className } = notificationMark(type);
  return (
    <span
      className={`flex size-11 shrink-0 items-center justify-center rounded-full ${className}`}
      aria-hidden
    >
      <Icon className="size-5" strokeWidth={1.75} />
    </span>
  );
}

function NotificationSkeleton() {
  return (
    <div className="space-y-2 px-2.5 py-2">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="flex gap-3 bg-popover p-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </Card>
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
    <div className="flex min-h-11 items-center justify-between gap-3 py-2">
      <span className="min-w-0 text-start">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
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
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {fetchFailed && !isLoading && (
          <Card className="mx-3 mb-2 flex items-center justify-between border-warning/30 bg-warning/5 px-3 py-2">
            <p className="text-xs text-muted-foreground">بارگذاری ناموفق</p>
            <Button type="button" variant="ghost" size="sm" className="h-11" onClick={() => fetchNotifications()}>
              <RefreshCw />
              تلاش مجدد
            </Button>
          </Card>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain pb-4">
          {isLoading && notifications.length === 0 ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="اعلانی نداری"
              description="وقتی لیست ذخیره‌شده به‌روز شود یا پیشنهادت تأیید شود، اینجا می‌بینی."
            />
          ) : (
            <>
              {(unreadCount > 0 || readCount > 0) && (
                <div className="flex items-center justify-between gap-2 border-b border-border px-2">
                  {unreadCount > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-11 text-brand"
                      onClick={markAllAsRead}
                      aria-label="علامت‌گذاری همه به عنوان خوانده‌شده"
                    >
                      <CheckCheck />
                      همه خوانده
                    </Button>
                  ) : (
                    <span />
                  )}
                  {readCount > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-11 text-muted-foreground"
                      onClick={() => void deleteReadNotifications()}
                    >
                      <Trash2 />
                      حذف خوانده‌شده‌ها
                    </Button>
                  ) : null}
                </div>
              )}
              <ul className="space-y-2 px-3 py-3" aria-label="لیست اعلان‌ها">
                {notifications.map((notification) => {
                  const rowClass = !notification.read
                    ? 'flex items-start gap-2 border-brand/30 bg-brand/5 p-3'
                    : 'flex items-start gap-2 bg-popover p-3';

                  return (
                    <li key={notification.id}>
                      <Card className={rowClass}>
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 gap-3 text-start"
                          onClick={(e) => handleNotificationClick(e, notification)}
                        >
                          <NotificationGlyph type={notification.type} />
                          <div className="min-w-0 flex-1 text-start">
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
                                  className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                                  aria-label="خوانده‌نشده"
                                />
                              )}
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="mt-1.5 wibe-caption text-muted-foreground">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 shrink-0 self-start rounded-full"
                          onClick={() => void deleteNotification(notification.id)}
                          aria-label="حذف اعلان"
                        >
                          <Trash2 />
                        </Button>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <Card className="mx-3 mt-2 bg-popover px-3">
            <p className="py-3 text-sm font-semibold text-foreground">
              تنظیمات اعلان
            </p>
            <PreferenceToggle
              label="به‌روزرسانی لیست‌های ذخیره‌شده"
              description="مثلاً «۳ رستوران به لیست X اضافه شد»"
              checked={preferences.allowBookmarkListNotifications}
              disabled={isSavingPref}
              onChange={(value) => void updateBookmarkPref(value)}
            />
          </Card>
        </div>
      </div>
    </BottomSheet>
  );
}

export function NotificationUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  const label = count > 9 ? '۹+' : count.toLocaleString('fa-IR');

  return (
    <span
      className="pointer-events-none absolute -top-0.5 end-0 z-20 flex size-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold leading-none text-white ring-2 ring-background"
      aria-hidden
    >
      {label}
    </span>
  );
}
