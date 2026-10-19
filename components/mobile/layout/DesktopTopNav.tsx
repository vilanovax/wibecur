'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HeaderDesktopSearch from '@/components/mobile/layout/HeaderDesktopSearch';
import HeaderActions from '@/components/mobile/layout/HeaderActions';
import { CONSUMER_NAV_ITEMS, isNavItemActive } from '@/components/mobile/layout/consumer-nav-config';
import { DESKTOP_CONTENT_PADDING_CLASS } from '@/lib/layout-tokens';
import { useUserHeaderProfile } from '@/lib/hooks/useUserHeaderProfile';
import SiteLogo from '@/components/shared/SiteLogo';

/** آیتم‌های ناو دسکتاپ — پروفایل از منوی آواتار در دسترس است */
const DESKTOP_NAV_ITEMS = CONSUMER_NAV_ITEMS.filter((item) => item.href !== '/profile');

/**
 * ناوبری افقی دسکتاپ — حس وب‌سایت به‌جای اپ کناری
 */
export default function DesktopTopNav() {
  const pathname = usePathname();
  const { profile } = useUserHeaderProfile();

  const navLinkClass = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
      active ? 'bg-brand/10' : 'hover:bg-muted'
    }`;

  return (
    <>
      <header
        className="sticky top-0 z-50 hidden w-full shrink-0 border-b border-border bg-card/95 backdrop-blur-md lg:block"
        role="banner"
      >
        <div className={`flex h-14 w-full min-w-0 items-center gap-3 ${DESKTOP_CONTENT_PADDING_CLASS}`}>
          {/* راست: لوگو + ناو — چسبیده به هم */}
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <SiteLogo variant="nav" href="/" />

            <nav
              className="flex min-w-0 items-center justify-start gap-0.5 overflow-x-auto scrollbar-hide"
              aria-label="منوی اصلی"
            >
              {DESKTOP_NAV_ITEMS.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={navLinkClass(active)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={`inline-flex items-center gap-1.5 ${active ? 'text-brand' : 'text-foreground'}`}>
                      {item.icon}
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* وسط: جستجو */}
          <div className="hidden min-w-0 flex-1 lg:flex lg:justify-center lg:px-2">
            <div className="w-full max-w-md">
              <HeaderDesktopSearch />
            </div>
          </div>

          {/* چپ: اعلان + منوی حساب */}
          <div className="flex shrink-0 items-center gap-1 border-s border-border ps-2">
            <HeaderActions profile={profile} enableAccountMenu />
          </div>
        </div>
      </header>
    </>
  );
}
