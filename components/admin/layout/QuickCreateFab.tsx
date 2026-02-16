'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, List, Package, Tag, Star } from 'lucide-react';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import clsx from 'clsx';

type FabItemConfig = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Show as primary for current route */
  highlight?: boolean;
};

function FabItem({
  label,
  href,
  icon: Icon,
  onClick,
  highlight,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
        'shadow-lg border border-admin-border dark:border-gray-600',
        highlight
          ? 'bg-violet-600 text-white border-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700'
          : 'bg-white dark:bg-gray-800 text-admin-text-primary dark:text-white hover:bg-admin-muted dark:hover:bg-gray-700'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function getFabItems(pathname: string | null): FabItemConfig[] {
  const base: FabItemConfig[] = [
    { label: 'ایجاد لیست', href: '/admin/lists/new', icon: List, highlight: false },
    { label: 'افزودن آیتم', href: '/admin/items/new', icon: Package, highlight: false },
    { label: 'ایجاد دسته', href: '/admin/categories/new', icon: Tag, highlight: false },
    { label: 'مدیریت Featured', href: '/admin/custom/featured', icon: Star, highlight: false },
  ];

  if (!pathname) return base;

  return base.map((item) => ({
    ...item,
    highlight:
      (pathname.startsWith('/admin/lists') && item.href === '/admin/lists/new') ||
      (pathname.startsWith('/admin/items') && item.href === '/admin/items/new') ||
      (pathname.startsWith('/admin/categories') && item.href === '/admin/categories/new') ||
      (pathname.startsWith('/admin/custom') && item.href === '/admin/custom/featured'),
  }));
}

export default function QuickCreateFab() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const items = getFabItems(pathname);

  useOutsideClick(containerRef, () => setOpen(false), open);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-6 z-30 flex flex-col items-end gap-3"
      dir="rtl"
    >
      <div
        className={clsx(
          'flex flex-col items-end gap-3 transition-all duration-200',
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none invisible'
        )}
      >
        {items.map((item) => (
            <FabItem
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              highlight={item.highlight}
              onClick={() => setOpen(false)}
            />
          ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg',
          'hover:bg-violet-700 active:scale-95 transition-all duration-200',
          open && 'rotate-45'
        )}
        aria-label={open ? 'بستن منو' : 'ایجاد سریع'}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
