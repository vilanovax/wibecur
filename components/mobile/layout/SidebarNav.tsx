'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Home, LayoutList, Compass, User, Plus, LogOut, Loader2 } from 'lucide-react';
import CreateSheet from '@/components/mobile/home/CreateSheet';
import { DESKTOP_SIDEBAR_WIDTH_CLASS } from '@/lib/layout-tokens';

const NAV_ITEMS: {
  href?: string;
  label: string;
  icon: React.ReactNode;
  isButton?: boolean;
}[] = [
  { href: '/', label: 'خانه', icon: <Home className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} /> },
  { href: '/lists', label: 'لیست‌ها', icon: <LayoutList className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} /> },
  { label: 'ساخت', icon: <Plus className="h-4 w-4" strokeWidth={2.5} />, isButton: true },
  { href: '/user-lists', label: 'اکسپلور', icon: <Compass className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} /> },
  { href: '/profile', label: 'پروفایل', icon: <User className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} /> },
];

type SidebarNavProps = {
  className?: string;
};

export default function SidebarNav({ className = '' }: SidebarNavProps) {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/login' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const linkClass = (active: boolean) =>
    `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 wibe-small font-medium transition-colors text-right ${
      active
        ? 'bg-primary/10 text-primary border-s-2 border-s-primary'
        : 'text-foreground hover:bg-gray-50/90 border-s-2 border-s-transparent'
    }`;

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-e border-wibe/80 bg-white lg:flex ${DESKTOP_SIDEBAR_WIDTH_CLASS} ${className}`}
        aria-label="ناوبری اصلی"
      >
        <div className="border-b border-wibe/80 px-3 py-3.5 text-right">
          <Link href="/" className="text-lg font-bold leading-none text-primary">
            وایب
          </Link>
          <p className="mt-0.5 wibe-caption leading-tight text-wibe-secondary">لیست‌های کیوریتد</p>
        </div>

        <nav className="flex flex-1 flex-col gap-px overflow-y-auto p-2" aria-label="منوی اصلی">
          {NAV_ITEMS.map((item) => {
            if (item.isButton) {
              return (
                <button
                  key="create"
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className={`${linkClass(false)} justify-start`}
                  aria-label="ساخت لیست یا آیتم"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            }
            const active = item.href ? pathname === item.href : false;
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={linkClass(active)}
                aria-current={active ? 'page' : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-wibe/80 p-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-right wibe-small font-medium text-wibe-secondary transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="خروج از حساب"
          >
            {isLoggingOut ? (
              <Loader2 className="h-[1.125rem] w-[1.125rem] shrink-0 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={2} aria-hidden />
            )}
            {isLoggingOut ? 'در حال خروج…' : 'خروج'}
          </button>
        </div>
      </aside>

      <CreateSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
