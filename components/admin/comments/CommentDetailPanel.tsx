'use client';

import Link from 'next/link';
import { CheckCircle, XCircle, ExternalLink, FileText, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import CommentStatusBadge from './CommentStatusBadge';
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
  onOpenFullDetail?: (comment: CommentRowData) => void;
  onEdit?: (comment: CommentRowData) => void;
  onDelete?: (commentId: string, preview: string) => void;
  approvingId: string | null;
  rejectingId: string | null;
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
  onOpenFullDetail,
  onEdit,
  onDelete,
  approvingId,
  rejectingId,
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

  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm flex flex-col min-h-[280px] lg:min-h-[calc(100vh-280px)] ${className}`}
      dir="rtl"
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">جزئیات</h2>
        <CommentStatusBadge
          isApproved={comment.isApproved}
          isFiltered={comment.isFiltered}
          reportsCount={comment._count.comment_reports}
          deletedAt={comment.deletedAt}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap bg-[var(--color-bg)] rounded-xl p-3 leading-relaxed">
          {displayContent}
        </p>

        <div className="flex items-center gap-2 text-sm">
          {comment.users.image ? (
            <img
              src={comment.users.image}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-xs font-medium">
              {(comment.users.name || comment.users.email)[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{comment.users.name || 'بدون نام'}</p>
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
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
              locale: faIR,
            })}
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
                    {formatDistanceToNow(new Date(r.createdAt), {
                      addSuffix: true,
                      locale: faIR,
                    })}
                    {r.resolved && (
                      <span className="mr-1 text-emerald-600">· حل‌شده</span>
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
        <div className="p-3 border-t border-[var(--color-border)] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onApprove(comment.id)}
            disabled={
              approvingId === comment.id ||
              rejectingId === comment.id ||
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
              disabled={approvingId === comment.id || rejectingId === comment.id}
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
              className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 text-sm hover:bg-rose-50"
            >
              حذف
            </button>
          )}
        </div>
      )}
    </div>
  );
}
