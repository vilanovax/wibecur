'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
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
}

const TRUNCATE_LEN = 60;

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
}: CommentRowProps) {
  const isReported = comment._count.comment_reports > 0;
  const isBadWords = comment.isFiltered;
  const riskReported = isReported;
  const riskBadWords = isBadWords && !riskReported;

  const rowClass = [
    'border-b border-slate-100 dark:border-gray-700 transition-colors',
    isActive && 'bg-indigo-50/80 dark:bg-indigo-900/20 ring-1 ring-inset ring-indigo-200',
    riskReported && 'border-r-4 border-r-rose-500 bg-rose-50/60 dark:bg-rose-900/20',
    riskBadWords && !riskReported && 'border-r-4 border-r-amber-500 bg-amber-50/60 dark:bg-amber-900/20',
  ]
    .filter(Boolean)
    .join(' ');

  const displayContent = filterBadWords
    ? filterBadWords(comment.content)
    : comment.content;
  const truncated =
    displayContent.length > TRUNCATE_LEN
      ? displayContent.slice(0, TRUNCATE_LEN) + '…'
      : displayContent;

  const isPending = approvingId === comment.id || rejectingId === comment.id;

  const handleRowClick = () => {
    if (onRowClick) onRowClick(comment);
  };

  return (
    <tr
      className={`hover:bg-slate-50/80 ${rowClass} ${onRowClick ? 'cursor-pointer' : ''}`}
      style={{ direction: 'rtl' }}
      onClick={onRowClick ? handleRowClick : undefined}
    >
      <td className="px-4 py-3 w-10">
        {!comment.deletedAt && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(comment.id)}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-slate-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
          />
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <UserAvatar
            src={comment.users.image}
            name={comment.users.name}
            email={comment.users.email}
            size={32}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
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
            <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{comment.users.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 max-w-[220px]">
        <span
          title={displayContent}
          className="text-sm text-slate-700 dark:text-gray-200 line-clamp-1 cursor-default"
        >
          {truncated}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/admin/items?id=${comment.items.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline truncate block max-w-[140px]"
        >
          {comment.items.title}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-gray-400 whitespace-nowrap">
        {formatDistanceToNow(new Date(comment.createdAt), {
          addSuffix: true,
          locale: faIR,
        })}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <CommentStatusBadge
            isApproved={comment.isApproved}
            isFiltered={comment.isFiltered}
            reportsCount={comment._count.comment_reports}
            deletedAt={comment.deletedAt}
          />
          {comment.isSeeded && (
            <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              Seed
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onView(comment)}
            className="p-2 rounded-lg text-slate-500 dark:text-gray-400 hover:bg-slate-100 hover:text-slate-700"
            title="مشاهده"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!comment.deletedAt && (
            <>
              <button
                type="button"
                onClick={() => onApprove(comment.id)}
                disabled={isPending || comment.isApproved}
                className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="تایید"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onReject(comment.id)}
                disabled={isPending}
                className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="رد"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(CommentRow);
