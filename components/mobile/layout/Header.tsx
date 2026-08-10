'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import HeaderActions, { type HeaderActionsProfile } from './HeaderActions';
import HeaderDesktopSearch from './HeaderDesktopSearch';
import SiteLogo from '@/components/shared/SiteLogo';
import { useUserHeaderProfile } from '@/lib/hooks/useUserHeaderProfile';

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
  /** کل هدر صفحه در دسکتاپ (وقتی نوار بالا کافی است) */
  hideOnDesktop?: boolean;
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
  hideOnDesktop = false,
}: HeaderProps) {
  const router = useRouter();
  const { session, profile } = useUserHeaderProfile();

  const sessionProfile = useMemo<HeaderActionsProfile | null>(() => {
    if (!session?.user?.id) return null;
    return {
      image: session.user.image ?? null,
      avatarType: null,
      avatarId: null,
      avatarStatus: null,
    };
  }, [session?.user?.id, session?.user?.image]);

  const displayProfile = profile ?? sessionProfile;

  const isDark = variant === 'dark';
  const headerClass = isDark
    ? 'sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm'
    : 'sticky top-0 z-50 border-b border-wibe bg-white shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-foreground';
  const iconClass = isDark ? 'text-gray-300' : 'text-wibe-secondary';
  const buttonClass = isDark
    ? 'bg-gray-800 hover:bg-gray-700'
    : 'bg-wibe-surface hover:bg-wibe-surface';

  return (
    <header
      className={`${headerClass} lg:sticky lg:top-14 lg:z-40 lg:mb-0 lg:border-b lg:border-wibe/60 lg:bg-wibe-surface/95 lg:backdrop-blur-sm ${
        hideOnDesktop ? 'lg:hidden' : ''
      }`}
      role="banner"
    >
      <div className="flex h-14 items-center justify-between gap-3 px-4 lg:h-12 lg:px-0">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-right">
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
            // Page body owns the real <h1>; sticky chrome stays a label to avoid duplicate headings.
            <p
              className={`truncate text-lg font-bold lg:text-xl ${textClass} ${
                hideTitleOnDesktop ? 'lg:sr-only' : ''
              }`}
            >
              {title}
            </p>
          ) : (
            <SiteLogo variant="header" href="/" className="lg:hidden" />
          )}
        </div>
        {showDesktopSearch && (
          <div className="hidden min-w-0 max-w-md flex-1 lg:block xl:max-w-lg">
            <HeaderDesktopSearch />
          </div>
        )}
        <div className="shrink-0 lg:hidden">
          <HeaderActions
            profile={displayProfile}
            hideNotifications={hideNotifications}
            variant={variant}
          />
        </div>
      </div>
    </header>
  );
}
