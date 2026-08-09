'use client';

import Link from 'next/link';
import { CheckCircle, XCircle, ExternalLink, FileText, Flag, FlagOff } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import CommentStatusBadge from './CommentStatusBadge';
import UserAvatar from '@/components/shared/UserAvatar';
import { UserPenaltyBadge, CommentRestrictionStatusBadge } from './UserPenaltyBadge';
import type { CommentRowData } from './CommentRow';

export type ReportDetailRow = {
  id: string;
  reason: string | null;
  resolved: boolean;
  createdAt: string;
  users: { name: string | null; email: string };
};

type Props = {
  comment: CommentRowData | null;
  reports?: ReportDetailRow[];
  reportCount?: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDiscardReports?: (id: string) => void;
  onOpenFullDetail?: (comment: CommentRowData) => void;
  onEdit?: (comment: CommentRowData) => void;
  onDelete?: (commentId: string, preview: string) => void;
  approvingId: string | null;
  rejectingId: string | null;
  discardingId?: string | null;
  filterBadWords?: (text: string) => string;
  showReject?: boolean;
  emptyLabel?: string;
  className?: string;
};

export default function CommentDetailPanel({
  comment,
  reports,
  reportCount,
  onApprove,
  onReject,
  onDiscardReports,
  onOpenFullDetail,
  onEdit,
  onDelete,
  approvingId,
  rejectingId,
  discardingId = null,
  filterBadWords,
  showReject = true,
  emptyLabel = 'یک کامنت از لیست انتخاب کنید',
  className = '',
}: Props) {
  if (!comment) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)]/50 flex items-center justify-center min-h-[280px] p-6 text-center text-sm text-[var(--color-text-muted)] ${className}`}
      >
        {emptyLabel}
      </div>
    );
  }

  const displayContent = filterBadWords
    ? filterBadWords(comment.content)
    : comment.content;

  const hasOpenReports =
    reports?.some((r) => !r.resolved) ??
    (reportCount ?? comment._count?.comment_reports ?? 0) > 0;
  const isActionBusy =
    approvingId === comment.id ||
    rejectingId === comment.id ||
    discardingId === comment.id;

  return (
    <div
      className={`rounded-2xl border bg-[var(--color-surface)] shadow-sm flex flex-col min-h-[280px] lg:min-h-[calc(100vh-280px)] ${
        comment.isSeeded
          ? 'border-violet-200 bg-violet-50/30'
          : 'border-[var(--color-border)]'
      } ${className}`}
      dir="rtl"
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">جزئیات</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {comment.isSeeded && (
            <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              ساختگی
            </span>
          )}
          <CommentStatusBadge
            isApproved={comment.isApproved}
            isFiltered={comment.isFiltered}
            reportsCount={comment._count.comment_reports}
            deletedAt={comment.deletedAt}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comment.isSeeded && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2 text-xs text-violet-800">
            <p className="font-medium">کامنت تولیدشده با AI</p>
            {comment.seedCampaign?.title && (
              <p className="mt-1">
                کمپین: <span className="font-semibold">{comment.seedCampaign.title}</span>
              </p>
            )}
            <p className="mt-1.5 flex flex-wrap gap-2">
              <Link
                href="/admin/comments/all?filter=seeded"
                className="text-violet-700 underline hover:no-underline"
              >
                همه کامنت‌های ساختگی
              </Link>
              <span className="text-violet-400">·</span>
              <Link
                href="/admin/comments/seed"
                className="text-violet-700 underline hover:no-underline"
              >
                کامنت‌سازی هوشمند
              </Link>
            </p>
            {!comment.deletedAt && onDelete && (
              <p className="mt-1 text-violet-600">برای غیرفعال‌سازی از دکمه «حذف» استفاده کنید.</p>
            )}
          </div>
        )}
        <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap bg-[var(--color-bg)] rounded-xl p-3 leading-relaxed">
          {displayContent}
        </p>

        <div className="flex items-center gap-2 text-sm">
          <UserAvatar
            src={comment.users.image}
            name={comment.users.name}
            email={comment.users.email}
            size={36}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium truncate">{comment.users.name || 'بدون نام'}</p>
              {comment.userModeration && (
                <>
                  <CommentRestrictionStatusBadge status={comment.userModeration.status} />
                  <UserPenaltyBadge
                    totalPenaltyScore={comment.userModeration.totalPenaltyScore}
                    status={comment.userModeration.status}
                  />
                </>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {comment.users.email}
            </p>
          </div>
        </div>

        <div className="text-xs text-[var(--color-text-muted)] space-y-1">
          <p>
            آیتم:{' '}
            <Link
              href={`/admin/items?id=${comment.items.id}`}
              className="text-[var(--primary)] hover:underline font-medium"
            >
              {comment.items.title}
            </Link>
          </p>
          <p>
            {formatRelativeTime(comment.createdAt)}
          </p>
        </div>

        {reports && reports.length > 0 && (
          <div className="pt-2 border-t border-[var(--color-border)]">
            <h3 className="text-xs font-semibold text-[var(--color-text)] mb-2 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-rose-500" />
              دلایل ریپورت ({reportCount ?? reports.length})
            </h3>
            <ul className="space-y-2 max-h-[200px] overflow-y-auto">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="text-xs rounded-lg bg-[var(--color-bg)] px-3 py-2 border border-[var(--color-border-muted)]"
                >
                  <p className="text-[var(--color-text)]">{r.reason || 'بدون دلیل'}</p>
                  <p className="text-[var(--color-text-muted)] mt-0.5">
                    {r.users.name || r.users.email} ·{' '}
                    {formatRelativeTime(r.createdAt)}
                    {r.resolved && (
                      <span className="mr-1 text-emerald-600 dark:text-emerald-400">· حل‌شده</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onOpenFullDetail && (
          <button
            type="button"
            onClick={() => onOpenFullDetail(comment)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
          >
            <FileText className="w-4 h-4" />
            ویرایش / حذف کامل
          </button>
        )}
      </div>

      {!comment.deletedAt && (
        <div className="p-3 border-t border-[var(--color-border)] flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
          {onDiscardReports && (
            <button
              type="button"
              onClick={() => onDiscardReports(comment.id)}
              disabled={isActionBusy || !hasOpenReports}
              className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              title="ریپورت اشتباه بود — بدون تغییر کامنت یا امتیاز منفی"
            >
              <FlagOff className="w-4 h-4" />
              رد ریپورت
            </button>
          )}
          <button
            type="button"
            onClick={() => onApprove(comment.id)}
            disabled={
              isActionBusy ||
              comment.isApproved
            }
            className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            تایید
          </button>
          {showReject && (
            <button
              type="button"
              onClick={() => onReject(comment.id)}
              disabled={isActionBusy}
              className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              رد
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(comment)}
              className="px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg)]"
            >
              ویرایش
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment.id, comment.content)}
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-sm hover:bg-rose-50"
            >
              حذف
            </button>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
