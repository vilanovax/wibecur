'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, LayoutList, Compass, User } from 'lucide-react';
import CreateSheet from '@/components/mobile/home/CreateSheet';
import { HOME_CREATE_SHEET_EVENT } from '@/lib/home-create-sheet';
import { MOBILE_BOTTOM_NAV_SPACER_CLASS } from '@/lib/layout-tokens';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'خانه',
    icon: <Home className="h-6 w-6" strokeWidth={2} />,
  },
  {
    href: '/lists',
    label: 'لیست',
    icon: <LayoutList className="h-6 w-6" strokeWidth={2} />,
  },
  {
    href: '/user-lists',
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

  useEffect(() => {
    const open = () => setCreateOpen(true);
    window.addEventListener(HOME_CREATE_SHEET_EVENT, open);
    return () => window.removeEventListener(HOME_CREATE_SHEET_EVENT, open);
  }, []);

  return (
    <>
      <div aria-hidden className={MOBILE_BOTTOM_NAV_SPACER_CLASS} />
      <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none lg:hidden">
        <nav
          className="pointer-events-auto w-full border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
          aria-label="ناوبری اصلی"
        >
          <div className="flex items-center justify-around py-3 px-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-[64px] flex-shrink-0 flex-col items-center justify-center px-2 py-2 ${
                    isActive ? 'text-primary' : 'text-gray-500'
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
      <CreateSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
