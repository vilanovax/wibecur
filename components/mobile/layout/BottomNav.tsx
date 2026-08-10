'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ComponentType } from 'react';
import { Home, LayoutList, Compass, User } from 'lucide-react';
import SiteFooter from '@/components/mobile/layout/SiteFooter';
import {
  EXPLORE_HREF,
  isNavItemActive,
} from '@/components/mobile/layout/consumer-nav-config';
import { HOME_CREATE_SHEET_EVENT } from '@/lib/home-create-sheet';
import { MOBILE_BOTTOM_NAV_SPACER_CLASS } from '@/lib/layout-tokens';

type CreateSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  {
    href: '/',
    label: 'خانه',
    icon: <Home className="h-6 w-6" strokeWidth={2} />,
  },
  {
    href: '/lists',
    label: 'لیست‌ها',
    icon: <LayoutList className="h-6 w-6" strokeWidth={2} />,
  },
  {
    href: EXPLORE_HREF,
    label: 'اکسپلور',
    icon: <Compass className="h-6 w-6" strokeWidth={2} />,
  },
  {
    href: '/profile',
    label: 'پروفایل',
    icon: <User className="h-6 w-6" strokeWidth={2} />,
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [CreateSheet, setCreateSheet] = useState<ComponentType<CreateSheetProps> | null>(
    null
  );

  useEffect(() => {
    const open = () => setCreateOpen(true);
    window.addEventListener(HOME_CREATE_SHEET_EVENT, open);
    return () => window.removeEventListener(HOME_CREATE_SHEET_EVENT, open);
  }, []);

  // Import only when opened — avoids next/dynamic prefetch of CreateSheet on home.
  useEffect(() => {
    if (!createOpen || CreateSheet) return;
    let cancelled = false;
    void import('@/components/mobile/home/CreateSheet').then((mod) => {
      if (!cancelled) setCreateSheet(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [createOpen, CreateSheet]);

  const isHome = pathname === '/';

  return (
    <>
      {/* Home peak-end: skip marketing footer; bottom nav already anchors the thumb zone */}
      {isHome ? null : <SiteFooter variant="mobile" />}
      <div aria-hidden className={MOBILE_BOTTOM_NAV_SPACER_CLASS} />
      <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none lg:hidden">
        <nav
          className="pointer-events-auto w-full border-t border-wibe bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
          aria-label="ناوبری اصلی"
        >
          <div className="flex items-center justify-around py-3 px-1">
            {NAV_ITEMS.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-[64px] flex-shrink-0 flex-col items-center justify-center rounded-lg px-2 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    isActive ? 'text-primary' : 'text-wibe-secondary'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="mt-1 whitespace-nowrap text-xs">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      {createOpen && CreateSheet ? (
        <CreateSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      ) : null}
    </>
  );
}
