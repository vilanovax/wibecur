'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, User, Settings, LogOut, ChevronLeft, Menu, PanelRightClose, PanelRightOpen, Trash2 } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { signOut, useSession } from 'next-auth/react';
import RoleBadge from '@/components/auth/RoleBadge';
import { ADMIN_PANEL_VERSION } from '@/lib/generated/admin-panel-version';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { BREADCRUMB_MAP } from '@/lib/admin/breadcrumb-labels';

/** سگمنت‌های مسیر که نباید به‌عنوان «جزئیات» (شناسه) نمایش داده شوند */
const BREADCRUMB_SEGMENT_LABELS: Record<string, string> = {
  'access-denied': 'عدم دسترسی',
  'user-created': 'لیست‌های کاربران',
  'bad-words': 'کلمات ممنوع',
  'item-reports': 'ریپورت آیتم‌ها',
  all: 'همه کامنت‌ها',
  reports: 'ریپورت کامنت‌ها',
  'new': 'جدید',
  edit: 'ویرایش',
  debug: 'دیباگ',
};

function getBreadcrumb(pathname: string | null): { href: string; label: string }[] {
  if (!pathname || !pathname.startsWith('/admin')) return [{ href: '/admin/dashboard', label: 'ادمین' }];
  const normalized = pathname.replace(/\/$/, '') || '/admin';
  if (normalized === '/admin' || normalized === '/admin/dashboard') {
    return [{ href: '/admin/dashboard', label: 'داشبورد' }];
  }
  const segments = normalized.split('/').filter(Boolean);
  const out: { href: string; label: string }[] = [{ href: '/admin/dashboard', label: 'داشبورد' }];
  let acc = '/admin';
  /** شناسه‌ای که در breadcrumb نمایش داده نمی‌شود ولی برای href لازم است */
  let hiddenResourceId: string | null = null;
  for (let i = 1; i < segments.length; i++) {
    // شناسه دسته را در breadcrumb نشان نده — مستقیم «ویرایش دسته»
    if (
      segments[i - 1] === 'categories' &&
      segments[i + 1] === 'edit' &&
      /^[A-Za-z0-9_-]+$/.test(segments[i])
    ) {
      hiddenResourceId = segments[i];
      continue;
    }
    if (
      segments[i - 1] === 'catalog' &&
      segments[i + 1] === 'edit' &&
      /^[A-Za-z0-9_-]+$/.test(segments[i])
    ) {
      hiddenResourceId = segments[i];
      continue;
    }
    // workspace لیست — شناسه را نشان نده
    if (
      segments[i - 1] === 'lists' &&
      /^[A-Za-z0-9_-]+$/.test(segments[i]) &&
      segments[i + 1] !== 'edit' &&
      segments[i + 1] !== 'debug'
    ) {
      acc += `/${segments[i]}`;
      const label = 'workspace لیست';
      if (out[out.length - 1]?.href !== acc) {
        out.push({ href: acc, label });
      }
      continue;
    }
    // شناسه لیست را رد کن — مستقیم «ویرایش لیست» / «دیباگ»
    if (
      segments[i - 1] === 'lists' &&
      (segments[i + 1] === 'edit' || segments[i + 1] === 'debug') &&
      /^[A-Za-z0-9_-]+$/.test(segments[i])
    ) {
      hiddenResourceId = segments[i];
      continue;
    }
    if (
      segments[i - 1] === 'items' &&
      segments[i + 1] === 'edit' &&
      /^[A-Za-z0-9_-]+$/.test(segments[i])
    ) {
      hiddenResourceId = segments[i];
      continue;
    }
    if (hiddenResourceId && (segments[i] === 'edit' || segments[i] === 'debug')) {
      acc += `/${hiddenResourceId}/${segments[i]}`;
      hiddenResourceId = null;
    } else {
      acc += '/' + segments[i];
    }
    let label = BREADCRUMB_MAP[acc];
    if (!label) {
      if (/\/categories\/[^/]+\/edit$/.test(acc)) {
        label = 'ویرایش دسته';
      } else if (/\/catalog\/[^/]+\/edit$/.test(acc)) {
        label = 'ویرایش آیتم';
      } else if (/\/lists\/[^/]+\/edit$/.test(acc)) {
        label = 'ویرایش لیست';
      } else if (/\/lists\/[^/]+\/debug$/.test(acc)) {
        label = 'دیباگ لیست';
      } else if (/\/items\/[^/]+\/edit$/.test(acc)) {
        label = 'ویرایش آیتم';
      } else if (BREADCRUMB_SEGMENT_LABELS[segments[i]]) {
        label = BREADCRUMB_SEGMENT_LABELS[segments[i]];
      } else if (/^[A-Za-z0-9_-]{10,}$/.test(segments[i])) {
        label = 'جزئیات';
      } else {
        label = segments[i];
      }
    }
    if (out[out.length - 1]?.href !== acc) {
      out.push({ href: acc, label });
    }
  }
  return out;
}

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { collapsed, setCollapsed, setMobileOpen } = useSidebar();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = getBreadcrumb(pathname);

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

  const fetchTrashCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/trash?countsOnly=1');
      const json = await res.json();
      if (json.success && json.counts) {
        setTrashCount(json.counts.total ?? 0);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchTrashCount();
    const t = setInterval(fetchTrashCount, 60_000);
    return () => clearInterval(t);
  }, [fetchTrashCount]);

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
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setShowProfileMenu(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 flex-shrink-0 flex items-center px-4 sm:px-6 lg:px-8 border-b border-admin-border dark:border-gray-600 bg-admin-card dark:bg-gray-800 shadow-admin" dir="rtl">
      {/* Right: Sidebar toggle + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile: hamburger opens drawer */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl hover:bg-admin-muted dark:hover:bg-gray-700 text-admin-text-primary dark:text-white transition-colors"
          aria-label="باز کردن منو"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Desktop: collapse/expand sidebar */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-2 rounded-xl hover:bg-admin-muted dark:hover:bg-gray-700 text-admin-text-secondary dark:text-[var(--color-text-subtle)] transition-colors"
          aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
        >
          {collapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2 min-w-0">
        {breadcrumbs.map((b, i) => {
          const isLast = i === breadcrumbs.length - 1;
          const className = `text-sm truncate max-w-[120px] ${
            isLast
              ? 'font-semibold text-admin-text-primary dark:text-white'
              : 'text-admin-text-secondary dark:text-[var(--color-text-subtle)] hover:text-admin-text-primary dark:hover:text-white'
          }`;
          return (
            <span key={`${b.href}-${i}`} className="flex items-center gap-2 shrink-0">
              {i > 0 && <ChevronLeft className="h-4 w-4 text-[var(--color-text-subtle)] rotate-180" />}
              {isLast ? (
                <span className={className}>{b.label}</span>
              ) : (
                <Link href={b.href} className={className}>
                  {b.label}
                </Link>
              )}
            </span>
          );
        })}
        </div>
      </div>

      {/* Spacer — سرچِ تزئینیِ غیرفعال حذف شد (handler/state نداشت و در داشبورد
          با سرچ کاربردیِ AdminTopBar تکراری می‌شد). */}
      <div className="flex-1" />

      {/* Left: Version + Trash + Profile + Notifications + Role */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="text-[11px] font-medium tabular-nums text-[var(--color-text-subtle)]/90 dark:text-[var(--color-text-muted)] select-none"
          title="Admin panel build version"
        >
          v{ADMIN_PANEL_VERSION}
        </span>

        <Link
          href="/admin/trash"
          aria-label={trashCount > 0 ? `زباله‌دان (${trashCount} مورد)` : 'زباله‌دان'}
          className="relative w-10 h-10 rounded-lg bg-admin-muted dark:bg-gray-700 hover:bg-admin-hover dark:hover:bg-gray-600 flex items-center justify-center transition-colors text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]"
        >
          <Trash2 className="h-5 w-5" />
          {trashCount > 0 && (
            <span className="absolute top-1 left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gray-500 text-[10px] text-white flex items-center justify-center">
              {trashCount > 99 ? '99+' : trashCount}
            </span>
          )}
        </Link>

        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={unreadCount > 0 ? `اعلان‌ها (${unreadCount} خوانده‌نشده)` : 'اعلان‌ها'}
            aria-expanded={showNotifications}
            className="relative w-10 h-10 rounded-lg bg-admin-muted dark:bg-gray-700 hover:bg-admin-hover dark:hover:bg-gray-600 flex items-center justify-center transition-colors text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-admin-lg border border-admin-border dark:border-gray-600 p-4 z-50 max-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-admin-text-primary dark:text-white">نوتیفیکیشن‌ها</h3>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllAsRead} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
                    همه را خواندم
                  </button>
                )}
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                {notificationsLoading ? (
                  <p className="text-sm text-admin-text-secondary dark:text-[var(--color-text-subtle)]">در حال بارگذاری…</p>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-admin-text-secondary dark:text-[var(--color-text-subtle)]">پیامی نیست.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => { setShowNotifications(false); if (!n.read) markAsRead(n.id); }}
                          className={`block p-3 rounded-lg text-right ${n.read ? 'bg-admin-muted dark:bg-gray-700/50' : 'bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800'}`}
                        >
                          <p className="text-sm font-medium text-admin-text-primary dark:text-white">{n.title}</p>
                          <p className="text-xs text-admin-text-secondary dark:text-[var(--color-text-subtle)] mt-1">{n.message}</p>
                          <p className="text-xs text-admin-text-tertiary dark:text-[var(--color-text-muted)] mt-2">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: faIR })}
                          </p>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={n.read}
                          onClick={() => markAsRead(n.id)}
                          className={`block w-full p-3 rounded-lg text-right disabled:cursor-default ${n.read ? 'bg-admin-muted dark:bg-gray-700/50' : 'bg-violet-50 dark:bg-violet-900/20'}`}
                        >
                          <p className="text-sm font-medium text-admin-text-primary dark:text-white">{n.title}</p>
                          <p className="text-xs text-admin-text-secondary dark:text-[var(--color-text-subtle)] mt-1">{n.message}</p>
                          <p className="text-xs text-admin-text-tertiary dark:text-[var(--color-text-muted)] mt-2">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: faIR })}
                          </p>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-admin-border dark:bg-gray-600" />

        <div className="flex items-center gap-2">
          <RoleBadge
            role={session?.user?.role as string}
            className="!bg-indigo-100 dark:!bg-indigo-900/40 !text-indigo-700 dark:!text-indigo-200 !border-0 px-3 py-1 rounded-full"
          />
        </div>

        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-admin-muted dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-semibold">
              {(session?.user?.name || session?.user?.email || 'ا').charAt(0)}
            </div>
            <span className="text-sm font-medium text-admin-text-primary dark:text-white max-w-[100px] truncate hidden sm:block">
              {session?.user?.name || session?.user?.email || 'ادمین'}
            </span>
            <User className="h-4 w-4 text-admin-text-tertiary dark:text-[var(--color-text-subtle)]" />
          </button>
          {showProfileMenu && (
            <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-admin-lg border border-admin-border dark:border-gray-600 py-2 z-50">
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-admin-text-primary dark:text-gray-200 hover:bg-admin-muted dark:hover:bg-gray-700"
                onClick={() => setShowProfileMenu(false)}
              >
                <Settings className="h-4 w-4" />
                تنظیمات
              </Link>
              <div className="my-2 border-t border-admin-border dark:border-gray-600" />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-right"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
