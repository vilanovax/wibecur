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
    allowed: 'bg-slate-100 text-slate-600',
    warn: 'bg-amber-100 text-amber-800',
    restricted: 'bg-orange-100 text-orange-800',
    banned: 'bg-rose-100 text-rose-800',
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
    allowed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-800 border-amber-200',
    restricted: 'bg-orange-50 text-orange-800 border-orange-200',
    banned: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[status]}`}
    >
      {commentStatusLabel(status)}
    </span>
  );
}
