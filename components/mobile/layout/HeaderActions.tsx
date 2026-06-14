'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2, LogOut, User } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import NotificationIcon from './NotificationIcon';
import { VIBE_AVATARS } from '@/lib/vibe-avatars';

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
  /** دسکتاپ: منوی dropdown روی آواتار (پروفایل + خروج) */
  enableAccountMenu?: boolean;
}

const MENU_WIDTH = 192;

function AccountAvatar({
  profile,
  userName,
  isDark,
  showChevron,
}: {
  profile: HeaderActionsProfile | null;
  userName: string;
  isDark: boolean;
  showChevron?: boolean;
}) {
  const showVibeAvatar = profile?.avatarType === 'DEFAULT' && profile?.avatarId;
  const vibeAvatar = showVibeAvatar ? VIBE_AVATARS.find((a) => a.id === profile!.avatarId!) : null;
  const showUploadedImage =
    profile?.avatarType === 'UPLOADED' && profile?.avatarStatus === 'APPROVED' && profile?.image;
  const headerAvatarUrl = showUploadedImage ? profile!.image! : null;

  return (
    <>
      {vibeAvatar ? (
        <div
          className={`flex h-full w-full items-center justify-center text-xl ${vibeAvatar.bgClass}`}
          title={userName}
        >
          {vibeAvatar.emoji}
        </div>
      ) : headerAvatarUrl ? (
        <UserAvatar src={headerAvatarUrl} name={userName} size={40} className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
          {userName.charAt(0).toUpperCase()}
        </div>
      )}
      {showChevron ? (
        <ChevronDown className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full bg-white text-wibe-secondary ring-1 ring-wibe/80" />
      ) : null}
    </>
  );
}

export default function HeaderActions({
  profile = null,
  hideNotifications = false,
  variant = 'default',
  enableAccountMenu = false,
}: HeaderActionsProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.email || 'کاربر';
  const isProfilePage = pathname === '/profile';
  const isDark = variant === 'dark';

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

  const avatarShellClass = `relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors ${
    isDark ? 'bg-gray-800 ring-1 ring-gray-700 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
  }`;

  const accountMenu =
    menuOpen && menuPos && enableAccountMenu && session?.user && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[200] w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left }}
            dir="rtl"
          >
            <Link
              href="/profile"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2.5 wibe-small hover:bg-[var(--color-bg)]"
              onClick={() => setMenuOpen(false)}
            >
              <User className="h-4 w-4 shrink-0 text-wibe-secondary" />
              پروفایل
            </Link>
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

  const showProfileControl = !isProfilePage || enableAccountMenu;

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {session?.user && !hideNotifications && <NotificationIcon />}
      {showProfileControl &&
        (enableAccountMenu && session?.user ? (
          <>
            <button
              ref={buttonRef}
              type="button"
              className={`${avatarShellClass} ${menuOpen ? 'ring-2 ring-primary/40' : ''}`}
              aria-label={`منوی حساب ${userName}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <AccountAvatar profile={profile} userName={userName} isDark={isDark} showChevron />
            </button>
            {accountMenu}
          </>
        ) : (
          <Link href={profileHref} className={avatarShellClass} aria-label={session?.user ? `پروفایل ${userName}` : 'ورود به حساب'}>
            <AccountAvatar profile={profile} userName={userName} isDark={isDark} />
          </Link>
        ))}
    </div>
  );
}
