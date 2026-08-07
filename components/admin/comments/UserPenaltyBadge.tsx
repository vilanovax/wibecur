'use client';

import type { CommentPermissionStatus } from '@/lib/comment-permission';
import { commentStatusLabel } from '@/lib/comment-permission';

export function UserPenaltyBadge({
  totalPenaltyScore,
  status,
  compact = false,
}: {
  totalPenaltyScore: number;
  status: CommentPermissionStatus;
  compact?: boolean;
}) {
  if (totalPenaltyScore <= 0 && status === 'allowed') return null;

  const statusStyles: Record<CommentPermissionStatus, string> = {
    allowed: 'bg-slate-100 dark:bg-gray-700/50 text-slate-600 dark:text-gray-300',
    warn: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    restricted: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    banned: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${statusStyles[status]}`}
      title={`${commentStatusLabel(status)} — امتیاز منفی ${totalPenaltyScore}`}
    >
      {!compact && <span>{commentStatusLabel(status)}</span>}
      <span>-{totalPenaltyScore.toLocaleString('fa-IR')}</span>
    </span>
  );
}

export function CommentRestrictionStatusBadge({
  status,
}: {
  status: CommentPermissionStatus;
}) {
  const styles: Record<CommentPermissionStatus, string> = {
    allowed: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    warn: 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    restricted: 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
    banned: 'bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[status]}`}
    >
      {commentStatusLabel(status)}
    </span>
  );
}
