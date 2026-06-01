'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronRight } from 'lucide-react';
import HeaderActions, { type HeaderActionsProfile } from './HeaderActions';
import HeaderDesktopSearch from './HeaderDesktopSearch';

interface HeaderProps {
  /** عنوان صفحه — بدون title لوگوی «وایب» نمایش داده می‌شود */
  title?: string;
  /** دکمه بازگشت برای صفحات drill-down */
  showBack?: boolean;
  /** تم تیره برای صفحات سینمایی (فیلم و سریال) */
  variant?: 'default' | 'dark';
  /** مخفی کردن آیکون اعلان */
  hideNotifications?: boolean;
  /** نمایش جستجو در نوار هدر دسکتاپ */
  showDesktopSearch?: boolean;
  /** مخفی عنوان در دسکتاپ (مثلاً وقتی در hero نمایش داده می‌شود) */
  hideTitleOnDesktop?: boolean;
}

/**
 * هدر ثابت اپ موبایل — همه صفحات اصلی:
 * [بازگشت؟] + [لوگو | عنوان]  ···  [اعلان + پروفایل]
 */
export default function Header({
  title,
  showBack = false,
  variant = 'default',
  hideNotifications = false,
  showDesktopSearch = true,
  hideTitleOnDesktop = false,
}: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [profile, setProfile] = useState<HeaderActionsProfile | null>(null);

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

  const isDark = variant === 'dark';
  const headerClass = isDark
    ? 'sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm'
    : 'sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const iconClass = isDark ? 'text-gray-300' : 'text-gray-600';
  const buttonClass = isDark
    ? 'bg-gray-800 hover:bg-gray-700'
    : 'bg-gray-100 hover:bg-gray-200';

  return (
    <header className={`${headerClass} lg:static lg:mb-0`} role="banner">
      <div className="flex h-14 items-center justify-between gap-3 px-4 lg:grid lg:h-[3.25rem] lg:grid-cols-[minmax(0,1fr)_minmax(260px,480px)_auto] lg:items-center lg:gap-4 lg:px-0">
        <div className="flex min-w-0 items-center gap-2 justify-self-start text-right">
          {showBack && (
            <button
              type="button"
              onClick={() => router.back()}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${buttonClass}`}
              aria-label="بازگشت"
            >
              <ChevronRight className={`h-6 w-6 ${iconClass}`} strokeWidth={2} />
            </button>
          )}
          {title ? (
            <h1
              className={`truncate text-lg font-bold lg:text-xl ${textClass} ${
                hideTitleOnDesktop ? 'lg:sr-only' : ''
              }`}
            >
              {title}
            </h1>
          ) : (
            <h1
              className={`text-xl font-bold lg:hidden ${isDark ? 'text-violet-400' : 'text-primary'}`}
            >
              وایب
            </h1>
          )}
        </div>
        {showDesktopSearch && (
          <div className="hidden min-w-0 justify-self-center lg:block lg:w-full">
            <HeaderDesktopSearch />
          </div>
        )}
        <div className="justify-self-end">
          <HeaderActions
            profile={profile}
            hideNotifications={hideNotifications}
            variant={variant}
          />
        </div>
      </div>
    </header>
  );
}
