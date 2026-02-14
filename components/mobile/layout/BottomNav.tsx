'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import CreateSheet from '@/components/mobile/home/CreateSheet';

export default function BottomNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  const navItems: { href?: string; label: string; icon: React.ReactNode; isButton?: boolean }[] = [
    {
      href: '/',
      label: 'خانه',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/lists',
      label: 'لیست',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
    },
    {
      label: 'ساخت',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
      isButton: true,
    },
    {
      href: '/user-lists',
      label: 'ذخیره‌ها',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: 'پروفایل',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg" aria-label="ناوبری اصلی">
        <div className="flex items-center justify-around py-3 overflow-x-auto">
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
                className={className}
                aria-label="ساخت لیست یا آیتم جدید"
              >
                  <span className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center -mt-4 shadow-md hover:bg-primary-dark transition-colors">
                    {item.icon}
                  </span>
                  <span className="text-xs mt-1 whitespace-nowrap">{item.label}</span>
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
      <CreateSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

