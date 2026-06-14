'use client';

import Link from 'next/link';
import { Clock, Flag, Package, CheckCircle, AlertTriangle, ShieldBan } from 'lucide-react';
import type { CommentsHubStats } from '@/lib/admin/comments-hub-stats';

export default function CommentsHubKpiStrip({ stats }: { stats: CommentsHubStats }) {
  const items = [
    {
      href: '/admin/comments/all?filter=pending',
      label: 'در انتظار',
      value: stats.comments.pending,
      icon: Clock,
      accent: 'from-amber-500/10 to-amber-600/5 border-amber-200/60',
    },
    {
      href: '/admin/comments/reports?resolved=false',
      label: 'ریپورت کامنت',
      value: stats.commentReports.open,
      icon: Flag,
      accent: 'from-rose-500/10 to-rose-600/5 border-rose-200/60',
    },
    {
      href: '/admin/comments/item-reports?resolved=false',
      label: 'ریپورت آیتم',
      value: stats.itemReportsOpen,
      icon: Package,
      accent: 'from-orange-500/10 to-orange-600/5 border-orange-200/60',
    },
    {
      href: '/admin/comments/all?filter=flagged',
      label: 'نیاز به بررسی',
      value: stats.comments.flagged,
      icon: AlertTriangle,
      accent: 'from-violet-500/10 to-violet-600/5 border-violet-200/60',
    },
    {
      href: '/admin/comments/violations',
      label: 'کاربران محدود',
      value: stats.violations.restrictedUsers,
      icon: ShieldBan,
      accent: 'from-rose-500/10 to-rose-600/5 border-rose-200/60',
    },
    {
      href: '/admin/comments/all?filter=approved',
      label: 'تاییدشده',
      value: stats.comments.approved,
      icon: CheckCircle,
      accent: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(({ href, label, value, icon: Icon, accent }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-xl border bg-gradient-to-br ${accent} p-3.5 transition-all hover:shadow-md hover:scale-[1.01]`}
        >
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
            <Icon className="w-3.5 h-3.5" />
            {label}
          </div>
          <p className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
            {value.toLocaleString('fa-IR')}
          </p>
        </Link>
      ))}
    </div>
  );
}
