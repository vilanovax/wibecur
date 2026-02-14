'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NotificationIcon from './NotificationIcon';
import { VIBE_AVATARS } from '@/lib/vibe-avatars';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  /** تم تیره برای صفحات سینمایی (فیلم و سریال) */
  variant?: 'default' | 'dark';
}

type ProfileAvatar = {
  image: string | null;
  avatarType?: string | null;
  avatarId?: string | null;
  avatarStatus?: string | null;
};

export default function Header({ title, showBack = false, variant = 'default' }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.email || 'کاربر';
  const isHome = pathname === '/';

  const [profile, setProfile] = useState<ProfileAvatar | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (data?.success && data?.data?.user) {
        const u = data.data.user;
        setProfile({
          image: u.image ?? null,
          avatarType: u.avatarType ?? null,
          avatarId: u.avatarId ?? null,
          avatarStatus: u.avatarStatus ?? null,
        });
      }
    } catch {
      setProfile(null);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user) fetchProfile();
    else setProfile(null);
  }, [session?.user, fetchProfile]);

  useEffect(() => {
    const onProfileUpdated = () => fetchProfile();
    window.addEventListener('profile-updated', onProfileUpdated);
    return () => window.removeEventListener('profile-updated', onProfileUpdated);
  }, [fetchProfile]);

  const showVibeAvatar = profile?.avatarType === 'DEFAULT' && profile?.avatarId;
  const vibeAvatar = showVibeAvatar ? VIBE_AVATARS.find((a) => a.id === profile!.avatarId!) : null;
  const showUploadedImage = profile?.avatarType === 'UPLOADED' && profile?.avatarStatus === 'APPROVED' && profile?.image;
  const headerAvatarUrl = showUploadedImage ? profile!.image! : null;

  const isDark = variant === 'dark';
  const headerClass = isDark
    ? 'bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50'
    : 'bg-white shadow-sm sticky top-0 z-50';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const iconClass = isDark ? 'text-gray-300' : 'text-gray-600';
  const buttonClass = isDark
    ? 'bg-gray-800 hover:bg-gray-700'
    : 'bg-gray-100 hover:bg-gray-200';

  return (
    <header className={headerClass} role="banner">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              type="button"
              onClick={() => router.back()}
              className={`w-10 h-10 rounded-full ${buttonClass} flex items-center justify-center flex-shrink-0 transition-colors`}
              aria-label="بازگشت"
            >
              <svg
                className={`w-6 h-6 ${iconClass}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {title ? (
            <h1 className={`text-xl font-bold truncate ${textClass}`}>{title}</h1>
          ) : (
            <h1 className={`text-xl font-bold ${isDark ? 'text-violet-400' : 'text-primary'}`}>وایب</h1>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {session?.user && <NotificationIcon />}
          {!isHome && (
            <Link
              href="/user-lists"
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${buttonClass} transition-colors`}
              title="لیست‌های من"
              aria-label="لیست‌های من"
            >
              <svg
                className={`w-5 h-5 ${iconClass}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            </Link>
          )}
          <Link
            href="/profile"
            className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 ring-1 ring-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            aria-label={`پروفایل ${userName}`}
          >
            {vibeAvatar ? (
              <div
                className={`w-full h-full flex items-center justify-center text-xl ${vibeAvatar.bgClass}`}
                title={userName}
              >
                {vibeAvatar.emoji}
              </div>
            ) : headerAvatarUrl ? (
              <Image
                src={headerAvatarUrl}
                alt={userName}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                unoptimized={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

