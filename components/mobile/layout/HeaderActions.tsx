'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ChevronDown, LayoutDashboard, Loader2, LogOut, User } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import {
  NotificationSheet,
  NotificationUnreadBadge,
  useNotifications,
} from './NotificationIcon';
import { GUEST_HEADER_AVATAR, resolveVibeAvatar } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import { usePermissions } from '@/hooks/usePermissions';

export type HeaderActionsProfile = {
  image: string | null;
  avatarType?: string | null;
  avatarId?: string | null;
  avatarStatus?: string | null;
};

interface HeaderActionsProps {
  profile?: HeaderActionsProfile | null;
  hideNotifications?: boolean;
  variant?: 'default' | 'dark';
  /** @deprecated منوی حساب برای همه کاربران لاگین‌شده فعال است */
  enableAccountMenu?: boolean;
}

const MENU_WIDTH = 192;
/** هدر موبایل: ۴۰px + ۲۰٪ */
const HEADER_AVATAR_PX = 48;

function AccountAvatar({
  profile,
  userName,
  isDark,
  isGuest = false,
}: {
  profile: HeaderActionsProfile | null;
  userName: string;
  isDark: boolean;
  isGuest?: boolean;
}) {
  const showVibeAvatar = profile?.avatarType === 'DEFAULT' && profile?.avatarId;
  const vibeAvatar = showVibeAvatar ? resolveVibeAvatar(profile!.avatarId!) : null;
  const showUploadedImage =
    profile?.avatarType === 'UPLOADED' && profile?.avatarStatus === 'APPROVED' && profile?.image;
  const headerAvatarUrl = showUploadedImage ? profile!.image! : null;

  if (isGuest) {
    return (
      <VibeAvatarDisplay avatar={GUEST_HEADER_AVATAR} size={HEADER_AVATAR_PX} className="h-full w-full" />
    );
  }

  return (
    <>
      {vibeAvatar ? (
        <div className="h-full w-full" title={userName}>
          <VibeAvatarDisplay avatar={vibeAvatar} size={HEADER_AVATAR_PX} className="h-full w-full" />
        </div>
      ) : headerAvatarUrl ? (
        <UserAvatar src={headerAvatarUrl} name={userName} size={HEADER_AVATAR_PX} className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
          {userName.charAt(0).toUpperCase()}
        </div>
      )}
    </>
  );
}

export default function HeaderActions({
  profile = null,
  hideNotifications = false,
  variant = 'default',
}: HeaderActionsProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isAdmin } = usePermissions();
  const userName = session?.user?.name || session?.user?.email || 'کاربر';
  const isProfilePage = pathname === '/profile';
  const isDark = variant === 'dark';
  const notifications = useNotifications(!hideNotifications);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const profileHref = session?.user
    ? '/profile'
    : `/login?callbackUrl=${encodeURIComponent(pathname || '/')}`;

  const updatePosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let left = rect.left;
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - MENU_WIDTH - 8);
    }

    setMenuPos({ top: rect.bottom + 6, left });
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) {
      setMenuPos(null);
      return;
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [menuOpen, updatePosition]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setMenuOpen(false);
    try {
      await signOut({ callbackUrl: '/login' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const openNotificationsFromMenu = () => {
    setMenuOpen(false);
    notifications.openNotifications();
  };

  const avatarInnerClass = `flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${
    isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-gray-200'
  }`;

  const avatarButtonClass = `relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
    isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-300/60'
  }`;

  const unreadLabel =
    notifications.unreadCount > 0
      ? `، ${notifications.unreadCount.toLocaleString('fa-IR')} اعلان خوانده‌نشده`
      : '';

  const accountMenu =
    menuOpen && menuPos && session?.user && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[200] w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left }}
            dir="rtl"
          >
            {!hideNotifications && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 wibe-small hover:bg-[var(--color-bg)]"
                onClick={openNotificationsFromMenu}
              >
                <Bell className="h-4 w-4 shrink-0 text-wibe-secondary" />
                <span>اعلان‌ها</span>
                {notifications.unreadCount > 0 && (
                  <span className="mr-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {notifications.unreadCount > 9
                      ? '9+'
                      : notifications.unreadCount.toLocaleString('fa-IR')}
                  </span>
                )}
              </button>
            )}
            <Link
              href="/profile"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2.5 wibe-small hover:bg-[var(--color-bg)]"
              onClick={() => setMenuOpen(false)}
            >
              <User className="h-4 w-4 shrink-0 text-wibe-secondary" />
              پروفایل
            </Link>
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2.5 wibe-small hover:bg-[var(--color-bg)]"
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 text-wibe-secondary" />
                پنل مدیریت
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 px-3 py-2.5 wibe-small text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
              onClick={handleLogout}
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 shrink-0" />
              )}
              {isLoggingOut ? 'در حال خروج…' : 'خروج'}
            </button>
          </div>,
          document.body
        )
      : null;

  const isGuest = !session?.user;
  const showProfileControl = isGuest || !isProfilePage || Boolean(session?.user);

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {showProfileControl &&
        (session?.user ? (
          <>
            <button
              ref={buttonRef}
              type="button"
              className={`${avatarButtonClass} ${menuOpen ? 'ring-2 ring-primary/40 rounded-full' : ''}`}
              aria-label={`منوی حساب ${userName}${unreadLabel}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={avatarInnerClass}>
                <AccountAvatar
                  profile={profile}
                  userName={userName}
                  isDark={isDark}
                  isGuest={isGuest}
                />
              </span>
              <ChevronDown className="absolute -bottom-0.5 -right-0.5 z-10 h-3.5 w-3.5 rounded-full bg-white text-wibe-secondary ring-1 ring-wibe/80" />
              {!hideNotifications && (
                <NotificationUnreadBadge count={notifications.unreadCount} />
              )}
            </button>
            {accountMenu}
            {!hideNotifications && <NotificationSheet center={notifications} />}
          </>
        ) : (
          <Link href={profileHref} className={avatarButtonClass} aria-label="ورود به حساب">
            <span className={avatarInnerClass}>
              <AccountAvatar
                profile={profile}
                userName={userName}
                isDark={isDark}
                isGuest={isGuest}
              />
            </span>
          </Link>
        ))}
    </div>
  );
}
