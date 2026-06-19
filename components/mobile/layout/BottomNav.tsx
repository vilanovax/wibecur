'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, LayoutList, Compass, User, Plus } from 'lucide-react';
import CreateSheet from '@/components/mobile/home/CreateSheet';
import { HOME_CREATE_SHEET_EVENT } from '@/lib/home-create-sheet';
import { MOBILE_BOTTOM_NAV_SPACER_CLASS } from '@/lib/layout-tokens';

export default function BottomNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const open = () => setCreateOpen(true);
    window.addEventListener(HOME_CREATE_SHEET_EVENT, open);
    return () => window.removeEventListener(HOME_CREATE_SHEET_EVENT, open);
  }, []);

  const navItems: { href?: string; label: string; icon: React.ReactNode; isButton?: boolean }[] = [
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
      label: 'ساخت',
      icon: <Plus className="h-7 w-7" strokeWidth={2.5} />,
      isButton: true,
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
  ];

  return (
    <>
      <div aria-hidden className={MOBILE_BOTTOM_NAV_SPACER_CLASS} />
      {/* fixed نسبت به viewport — spacer بالا فقط به اندازه همین نوار */}
      <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none lg:hidden">
        <nav
          className="pointer-events-auto w-full border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
          aria-label="ناوبری اصلی"
        >
          <div className="flex items-center justify-around py-3 px-1">
          {navItems.map((item, idx) => {
            const isCreate = item.isButton;
            const isActive = !isCreate && item.href ? pathname === item.href : false;
            const className = `flex flex-col items-center justify-center px-2 py-2 flex-shrink-0 min-w-[64px] ${isActive ? 'text-primary' : 'text-gray-500'}`;
            if (isCreate) {
              return (
                <button
                  key="create"
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex flex-col items-center justify-center px-2 py-2 flex-shrink-0 min-w-[56px] text-primary"
                  aria-label="ساخت لیست یا آیتم جدید"
                  title="ساخت"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white -mt-4 shadow-md transition-colors hover:bg-primary-dark active:scale-[0.98]">
                    {item.icon}
                  </span>
                </button>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={className}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="text-xs mt-1 whitespace-nowrap">{item.label}</span>
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

