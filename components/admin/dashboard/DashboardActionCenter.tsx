'use client';

import Link from 'next/link';
import {
  Shield,
  Clock,
  Flag,
  Package,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  ChevronLeft,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';
import type {
  ActionQueueItem,
  CommentsModerationSnapshot,
  RiskItem,
} from '@/lib/admin/types';

const PRIMARY_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  'comment-reports': Flag,
  'item-reports': Package,
  suggestions: Lightbulb,
};

const severityRing = {
  high: 'ring-rose-300/70 border-rose-200/80',
  medium: 'ring-amber-300/70 border-amber-200/80',
  low: 'ring-slate-200/80',
};

/** Risk rows duplicated by primary action cards — skip in sidebar list */
const DUPLICATE_RISK_IDS = new Set([
  'comments-pending',
  'item-reports',
  'comment-reports',
  'filtered-comments',
  'pending-lists',
]);

interface DashboardActionCenterProps {
  actionQueue: ActionQueueItem[];
  comments: CommentsModerationSnapshot;
  riskAlerts: RiskItem[];
}

export default function DashboardActionCenter({
  actionQueue,
  comments,
  riskAlerts,
}: DashboardActionCenterProps) {
  const primary: {
    id: string;
    label: string;
    count: number;
    href: string;
    severity: ActionQueueItem['severity'];
    iconKey: string;
  }[] = [
    {
      id: 'pending',
      label: 'کامنت در انتظار',
      count: comments.pending,
      href: '/admin/comments/all?filter=pending',
      severity: comments.pending > 3 ? 'high' : comments.pending > 0 ? 'medium' : 'low',
      iconKey: 'pending',
    },
    {
      id: 'comment-reports',
      label: 'ریپورت کامنت',
      count: comments.unresolvedCommentReports,
      href: '/admin/comments/reports?resolved=false',
      severity:
        comments.unresolvedCommentReports > 2
          ? 'high'
          : comments.unresolvedCommentReports > 0
            ? 'medium'
            : 'low',
      iconKey: 'comment-reports',
    },
    {
      id: 'item-reports',
      label: 'ریپورت آیتم',
      count: comments.unresolvedItemReports,
      href: '/admin/comments/item-reports?resolved=false',
      severity:
        comments.unresolvedItemReports > 2
          ? 'high'
          : comments.unresolvedItemReports > 0
            ? 'medium'
            : 'low',
      iconKey: 'item-reports',
    },
  ];

  const suggestionItem = actionQueue.find((a) => a.id === 'action-suggestions');
  if (suggestionItem) {
    primary.push({
      id: 'suggestions',
      label: suggestionItem.label,
      count: suggestionItem.count,
      href: suggestionItem.href,
      severity: suggestionItem.severity,
      iconKey: 'suggestions',
    });
  }

  const actionTotal = primary.reduce((s, p) => s + p.count, 0);

  const secondary = [
    {
      key: 'flagged',
      label: 'نیاز به بررسی',
      value: comments.flagged,
      href: '/admin/comments/all?filter=flagged',
    },
    {
      key: 'filtered',
      label: 'کلمات فیلترشده',
      value: comments.filtered,
      href: '/admin/comments/all?filter=filtered',
    },
  ].filter((s) => s.value > 0);

  const extraRisks = riskAlerts.filter((r) => !DUPLICATE_RISK_IDS.has(r.id));

  const allClear =
    actionTotal === 0 &&
    secondary.length === 0 &&
    extraRisks.length === 0;

  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80">
        <div className="flex items-center gap-3">
          <span
            className={`p-2 rounded-xl ${
              actionTotal > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'
            }`}
          >
            <Shield
              className={`w-5 h-5 ${
                actionTotal > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              مرکز اقدام
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {allClear
                ? 'همه صف‌ها خالی است'
                : `${actionTotal.toLocaleString('fa-IR')} مورد اولویت‌دار`}
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

      {allClear ? (
        <div className="flex items-center gap-3 px-4 sm:px-6 py-8 text-emerald-700">
          <CheckCircle2 className="w-8 h-8 shrink-0 text-emerald-500" />
          <div>
            <p className="font-medium text-[var(--color-text)]">
              وضعیت مودریشن مطلوب است
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              کامنت معلق، ریپورت باز و هشدار اضافه‌ای وجود ندارد.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {primary.map((item) => {
              const Icon = PRIMARY_ICONS[item.iconKey] ?? MessageSquare;
              const isEmpty = item.count === 0;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`rounded-xl border bg-[var(--color-surface)] p-4 transition-all hover:shadow-md hover:border-[var(--primary)]/40 ring-1 ${
                    isEmpty ? 'border-[var(--color-border)] opacity-75' : severityRing[item.severity]
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="p-2 rounded-lg bg-[var(--color-bg)]">
                      <Icon className="w-5 h-5 text-[var(--color-text)]" />
                    </span>
                    <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)] rotate-180" />
                  </div>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--color-text)]">
                    {item.count.toLocaleString('fa-IR')}
                  </p>
                  <p className="text-sm font-medium text-[var(--color-text)] mt-1">
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {isEmpty ? 'بدون مورد باز' : 'نیازمند اقدام'}
                  </p>
                </Link>
              );
            })}
          </div>

          {(secondary.length > 0 || extraRisks.length > 0) && (
            <div className="px-4 sm:px-6 pb-4 flex flex-col gap-3">
              {secondary.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                    سایر موارد:
                  </span>
                  {secondary.map((s) => (
                    <Link
                      key={s.key}
                      href={s.href}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--primary)]/40 transition-colors"
                    >
                      {s.label}
                      <span className="tabular-nums text-[var(--primary)]">
                        {s.value.toLocaleString('fa-IR')}
                      </span>
                    </Link>
                  ))}
                  <Link
                    href="/admin/comments/all?filter=approved"
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--primary)] mr-auto"
                  >
                    {comments.approved.toLocaleString('fa-IR')} تاییدشده ←
                  </Link>
                </div>
              )}

              {extraRisks.length > 0 && (
                <ul className="rounded-xl border border-amber-200/80 bg-amber-50/50 divide-y divide-amber-200/50">
                  {extraRisks.map((risk) => (
                    <li key={risk.id}>
                      {risk.href ? (
                        <Link
                          href={risk.href}
                          className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-900 hover:bg-amber-100/50"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span className="flex-1">{risk.label}</span>
                          {risk.count != null && (
                            <span className="tabular-nums font-medium">
                              {risk.count.toLocaleString('fa-IR')}
                            </span>
                          )}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-900">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{risk.label}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
