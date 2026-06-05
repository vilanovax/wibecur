'use client';

import Link from 'next/link';
import {
  MessageSquare,
  Clock,
  Flag,
  Package,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  LayoutGrid,
} from 'lucide-react';
import type { CommentsModerationSnapshot } from '@/lib/admin/types';

type MetricCard = {
  key: string;
  label: string;
  value: number;
  href: string;
  icon: typeof MessageSquare;
  gradient: string;
  highlight?: boolean;
};

export default function CommentsModerationWidgets({
  data,
}: {
  data: CommentsModerationSnapshot;
}) {
  const metrics: MetricCard[] = [
    {
      key: 'pending',
      label: 'در انتظار بررسی',
      value: data.pending,
      href: '/admin/comments/all?filter=pending',
      icon: Clock,
      gradient: 'from-amber-500/12 to-amber-600/5 border-amber-200/70',
      highlight: data.pending > 0,
    },
    {
      key: 'comment-reports',
      label: 'ریپورت کامنت (باز)',
      value: data.unresolvedCommentReports,
      href: '/admin/comments/reports?resolved=false',
      icon: Flag,
      gradient: 'from-rose-500/12 to-rose-600/5 border-rose-200/70',
      highlight: data.unresolvedCommentReports > 0,
    },
    {
      key: 'item-reports',
      label: 'ریپورت آیتم (باز)',
      value: data.unresolvedItemReports,
      href: '/admin/comments/item-reports?resolved=false',
      icon: Package,
      gradient: 'from-orange-500/12 to-orange-600/5 border-orange-200/70',
      highlight: data.unresolvedItemReports > 0,
    },
    {
      key: 'flagged',
      label: 'نیاز به بررسی',
      value: data.flagged,
      href: '/admin/comments/all?filter=flagged',
      icon: AlertTriangle,
      gradient: 'from-violet-500/12 to-violet-600/5 border-violet-200/70',
      highlight: data.flagged > 0,
    },
    {
      key: 'filtered',
      label: 'کلمات بد',
      value: data.filtered,
      href: '/admin/comments/all?filter=filtered',
      icon: MessageSquare,
      gradient: 'from-slate-500/10 to-slate-600/5 border-slate-200/70',
    },
    {
      key: 'approved',
      label: 'تایید شده',
      value: data.approved,
      href: '/admin/comments/all?filter=approved',
      icon: CheckCircle,
      gradient: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/60',
    },
  ];

  const actionTotal =
    data.pending + data.unresolvedCommentReports + data.unresolvedItemReports;

  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-[var(--primary)]/10">
            <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              نظارت بر کامنت‌ها
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {actionTotal > 0
                ? `${actionTotal.toLocaleString('fa-IR')} مورد نیازمند اقدام`
                : 'صف بررسی خالی است'}
            </p>
          </div>
        </div>
        <Link
          href="/admin/comments"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <LayoutGrid className="w-4 h-4" />
          داشبورد کامنت‌ها
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map(({ key, label, value, href, icon: Icon, gradient, highlight }) => (
          <Link
            key={key}
            href={href}
            className={`group relative rounded-xl border bg-gradient-to-br ${gradient} p-3 sm:p-4 transition-all hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
              highlight ? 'ring-1 ring-rose-300/50' : ''
            }`}
          >
            {highlight && value > 0 && (
              <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
            <Icon className="w-4 h-4 text-[var(--color-text-muted)] mb-2" />
            <p className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
              {value.toLocaleString('fa-IR')}
            </p>
            <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-1 leading-snug">
              {label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
