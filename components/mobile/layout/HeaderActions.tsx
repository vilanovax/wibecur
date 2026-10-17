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
        <div className="flex h-full w-full items-center justify-center bg-brand text-sm font-bold text-brand-foreground">
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
    isDark ? 'bg-foreground ring-1 ring-foreground' : 'bg-muted'
  }`;

  const avatarButtonClass = `relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
    isDark ? 'hover:bg-foreground/80' : 'hover:bg-muted'
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
            data-theme="paper"
            className="fixed z-[200] w-48 rounded-surface border border-border bg-popover py-1 shadow-surface"
            style={{ top: menuPos.top, left: menuPos.left }}
            dir="rtl"
          >
            {!hideNotifications && (
              <button
                type="button"
                role="menuitem"
                className="flex h-11 w-full items-center gap-2 px-3 text-sm hover:bg-muted"
                onClick={openNotificationsFromMenu}
              >
                <Bell className="size-4 shrink-0 text-muted-foreground" />
                <span>اعلان‌ها</span>
                {notifications.unreadCount > 0 && (
                  <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-white">
                    {notifications.unreadCount > 9
                      ? '۹+'
                      : notifications.unreadCount.toLocaleString('fa-IR')}
                  </span>
                )}
              </button>
            )}
            <Link
              href="/profile"
              role="menuitem"
              className="flex h-11 items-center gap-2 px-3 text-sm hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              <User className="size-4 shrink-0 text-muted-foreground" />
              پروفایل
            </Link>
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                role="menuitem"
                className="flex h-11 items-center gap-2 px-3 text-sm hover:bg-muted"
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard className="size-4 shrink-0 text-muted-foreground" />
                پنل مدیریت
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              disabled={isLoggingOut}
              className="flex h-11 w-full items-center gap-2 px-3 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
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
              className={`${avatarButtonClass} ${menuOpen ? 'rounded-full ring-2 ring-brand/40' : ''}`}
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
              <ChevronDown className="absolute -bottom-0.5 -start-0.5 z-10 size-4 rounded-full bg-popover text-muted-foreground ring-1 ring-border" />
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
