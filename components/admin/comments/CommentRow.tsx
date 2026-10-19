'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import CommentStatusBadge from './CommentStatusBadge';
import UserAvatar from '@/components/shared/UserAvatar';
import { UserPenaltyBadge } from './UserPenaltyBadge';
import type { CommentPermissionStatus } from '@/lib/comment-permission';

export interface CommentRowData {
  id: string;
  content: string;
  isFiltered: boolean;
  isApproved: boolean;
  isSeeded?: boolean;
  seedCampaign?: { id: string; title: string } | null;
  likeCount: number;
  createdAt: string;
  deletedAt?: string | null;
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  userModeration?: {
    totalPenaltyScore: number;
    status: CommentPermissionStatus;
    restrictedUntil: string | null;
  };
  items: {
    id: string;
    title: string;
  };
  _count: {
    comment_reports: number;
  };
}

interface CommentRowProps {
  comment: CommentRowData;
  isSelected: boolean;
  isActive?: boolean;
  onToggleSelect: (id: string) => void;
  onView: (comment: CommentRowData) => void;
  onRowClick?: (comment: CommentRowData) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approvingId: string | null;
  rejectingId: string | null;
  filterBadWords?: (text: string) => string;
  hideMetaColumns?: boolean;
}

function CommentRow({
  comment,
  isSelected,
  isActive = false,
  onToggleSelect,
  onView,
  onRowClick,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
  filterBadWords,
  hideMetaColumns = false,
}: CommentRowProps) {
  const isReported = comment._count.comment_reports > 0;
  const isBadWords = comment.isFiltered;

  const rowClass = [
    'border-b border-[var(--color-border-muted)] transition-colors duration-150',
    isActive &&
      'bg-[var(--primary)]/[0.07] shadow-[inset_3px_0_0_0_var(--primary)]',
    !isActive && comment.isSeeded && 'bg-violet-50/40',
    !isActive && isReported && 'bg-rose-50/50',
    !isActive && isBadWords && !isReported && 'bg-amber-50/45',
  ]
    .filter(Boolean)
    .join(' ');

  const displayContent = filterBadWords
    ? filterBadWords(comment.content)
    : comment.content;

  const isBusy = approvingId === comment.id || rejectingId === comment.id;

  const handleRowClick = () => {
    if (onRowClick) onRowClick(comment);
  };

  return (
    <tr
      className={`group hover:bg-[var(--color-bg)]/80 ${rowClass} ${
        onRowClick ? 'cursor-pointer' : ''
      }`}
      dir="rtl"
      onClick={onRowClick ? handleRowClick : undefined}
      aria-selected={isActive}
    >
      <td className="px-2.5 py-2 w-9 align-middle">
        {!comment.deletedAt && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(comment.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`انتخاب کامنت ${comment.users.name || comment.users.email}`}
            className="rounded border-[var(--color-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
          />
        )}
      </td>
      <td className="px-2.5 py-2 align-middle">
        <div className="flex items-center gap-2 min-w-0">
          <UserAvatar
            src={comment.users.image}
            name={comment.users.name}
            email={comment.users.email}
            size={hideMetaColumns ? 28 : 26}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">
                {comment.users.name || 'بدون نام'}
              </p>
              {comment.userModeration && (
                <UserPenaltyBadge
                  totalPenaltyScore={comment.userModeration.totalPenaltyScore}
                  status={comment.userModeration.status}
                  compact
                />
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {comment.users.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-2.5 py-2 align-middle">
        <div className="flex items-start gap-2 min-w-0">
          <p
            title={displayContent}
            className="text-sm text-[var(--color-text)] line-clamp-2 leading-snug flex-1 min-w-0"
          >
            {displayContent}
          </p>
          {(isReported || isBadWords || comment.isSeeded) && (
            <div className="flex flex-col gap-0.5 shrink-0">
              {isReported && (
                <span className="text-xs font-medium text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                  ریپورت
                </span>
              )}
              {isBadWords && (
                <span className="text-xs font-medium text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                  کلمه بد
                </span>
              )}
              {comment.isSeeded && (
                <span
                  className="text-xs font-medium text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-md whitespace-nowrap"
                  title={comment.seedCampaign?.title ?? 'کامنت ساختگی'}
                >
                  ساختگی
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="px-2.5 py-2 align-middle">
        <Link
          href={`/admin/items?id=${comment.items.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-[var(--primary)] hover:underline truncate block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35 rounded"
          title={comment.items.title}
        >
          {comment.items.title}
        </Link>
        {hideMetaColumns && (
          <p className="text-xs text-[var(--color-text-muted)] tabular-nums mt-0.5">
            {formatRelativeTime(comment.createdAt)}
          </p>
        )}
      </td>
      {!hideMetaColumns && (
        <>
          <td className="px-2.5 py-2 text-xs text-[var(--color-text-muted)] whitespace-nowrap tabular-nums align-middle">
            {formatRelativeTime(comment.createdAt)}
          </td>
          <td className="px-2.5 py-2 align-middle">
            <CommentStatusBadge
              isApproved={comment.isApproved}
              isFiltered={comment.isFiltered}
              reportsCount={comment._count.comment_reports}
              deletedAt={comment.deletedAt}
            />
          </td>
          <td className="px-2.5 py-2 align-middle">
            <div
              className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onView(comment)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35"
                title="جزئیات"
              >
                <Eye className="w-4 h-4" />
              </button>
              {!comment.deletedAt && (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove(comment.id)}
                    disabled={isBusy || comment.isApproved}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                    title={comment.isApproved ? 'تایید شده' : 'تایید'}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(comment.id)}
                    disabled={isBusy}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/35"
                    title="رد"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </td>
        </>
      )}
    </tr>
  );
}

export default memo(CommentRow);
