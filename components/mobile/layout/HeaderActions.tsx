'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  /** مخفی کردن آیکون اعلان (پیش‌فرض: نمایش برای کاربر لاگین‌شده) */
  hideNotifications?: boolean;
  /** تم تیره */
  variant?: 'default' | 'dark';
}

/**
 * اکشن‌های ثابت سمت چپ هدر در همه صفحات اصلی:
 * اعلان (برای کاربر لاگین‌شده) · پروفایل
 */
export default function HeaderActions({
  profile = null,
  hideNotifications = false,
  variant = 'default',
}: HeaderActionsProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.email || 'کاربر';
  const isProfilePage = pathname === '/profile';
  const isDark = variant === 'dark';

  const showVibeAvatar = profile?.avatarType === 'DEFAULT' && profile?.avatarId;
  const vibeAvatar = showVibeAvatar ? VIBE_AVATARS.find((a) => a.id === profile!.avatarId!) : null;
  const showUploadedImage =
    profile?.avatarType === 'UPLOADED' && profile?.avatarStatus === 'APPROVED' && profile?.image;
  const headerAvatarUrl = showUploadedImage ? profile!.image! : null;

  const profileHref = session?.user
    ? '/profile'
    : `/login?callbackUrl=${encodeURIComponent(pathname || '/')}`;

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {session?.user && !hideNotifications && <NotificationIcon />}
      {!isProfilePage && (
        <Link
          href={profileHref}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors ${
            isDark
              ? 'bg-gray-800 ring-1 ring-gray-700 hover:bg-gray-700'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          aria-label={session?.user ? `پروفایل ${userName}` : 'ورود به حساب'}
        >
          {vibeAvatar ? (
            <div
              className={`flex h-full w-full items-center justify-center text-xl ${vibeAvatar.bgClass}`}
              title={userName}
            >
              {vibeAvatar.emoji}
            </div>
          ) : headerAvatarUrl ? (
            <UserAvatar
              src={headerAvatarUrl}
              name={userName}
              size={40}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      )}
    </div>
  );
}
