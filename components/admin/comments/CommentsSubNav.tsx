'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  MessageSquare,
  Flag,
  Package,
  BookMarked,
  ShieldBan,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export type CommentsNavStats = {
  pending?: number;
  commentReportsOpen?: number;
  itemReportsOpen?: number;
};

const NAV = [
  {
    href: '/admin/comments',
    label: 'داشبورد',
    icon: LayoutGrid,
    exact: true,
    badgeKey: null as keyof CommentsNavStats | null,
    permission: null as 'moderate_comments' | 'view_reports' | null,
  },
  {
    href: '/admin/comments/all',
    label: 'همه کامنت‌ها',
    icon: MessageSquare,
    exact: false,
    badgeKey: 'pending' as const,
    permission: 'moderate_comments' as const,
  },
  {
    href: '/admin/comments/reports?resolved=false',
    label: 'ریپورت کامنت',
    icon: Flag,
    exact: false,
    badgeKey: 'commentReportsOpen' as const,
    permission: 'view_reports' as const,
  },
  {
    href: '/admin/comments/item-reports?resolved=false',
    label: 'ریپورت آیتم',
    icon: Package,
    exact: false,
    badgeKey: 'itemReportsOpen' as const,
    permission: 'view_reports' as const,
  },
  {
    href: '/admin/comments/bad-words',
    label: 'کلمات ممنوع',
    icon: BookMarked,
    exact: false,
    badgeKey: null,
    permission: 'moderate_comments' as const,
  },
  {
    href: '/admin/comments/violations',
    label: 'تخلفات',
    icon: ShieldBan,
    exact: false,
    badgeKey: null,
    permission: 'moderate_comments' as const,
  },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  const base = href.split('?')[0];
  if (exact) return pathname === base;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export default function CommentsSubNav({ stats }: { stats?: CommentsNavStats }) {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visible = NAV.filter(
    (item) => !item.permission || can(item.permission)
  );

  return (
    <nav
      className="flex gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] overflow-x-auto mb-6"
      dir="rtl"
      aria-label="ناوبری کامنت‌ها"
    >
      {visible.map(({ href, label, icon: Icon, exact, badgeKey }) => {
        const active = pathname ? isActive(pathname, href, exact) : false;
        const badge =
          badgeKey && stats?.[badgeKey] != null && stats[badgeKey]! > 0
            ? stats[badgeKey]
            : null;
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            {badge != null && (
              <span className="min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold tabular-nums">
                {badge.toLocaleString('fa-IR')}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
