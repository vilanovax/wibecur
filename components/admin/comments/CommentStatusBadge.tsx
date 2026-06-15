'use client';

type CommentStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'FLAGGED';

interface CommentStatusBadgeProps {
  isApproved: boolean;
  isFiltered: boolean;
  reportsCount?: number;
  deletedAt?: string | null;
}

function getStatus(
  isApproved: boolean,
  isFiltered: boolean,
  reportsCount: number,
  deletedAt: string | null | undefined
): CommentStatus {
  if (deletedAt) return 'REJECTED';
  if (isApproved && !isFiltered && reportsCount === 0) return 'APPROVED';
  if (isFiltered || reportsCount > 0) return 'FLAGGED';
  return 'PENDING';
}

const STYLES: Record<
  CommentStatus,
  { label: string; className: string }
> = {
  APPROVED: {
    label: 'تایید شده',
    className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  },
  PENDING: {
    label: 'در انتظار بررسی',
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  },
  REJECTED: {
    label: 'رد شده',
    className: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  },
  FLAGGED: {
    label: 'نیاز به بررسی',
    className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  },
};

export default function CommentStatusBadge({
  isApproved,
  isFiltered,
  reportsCount = 0,
  deletedAt,
}: CommentStatusBadgeProps) {
  const status = getStatus(isApproved, isFiltered, reportsCount, deletedAt);
  const { label, className } = STYLES[status];

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {label}
      {reportsCount > 0 && status === 'FLAGGED' && (
        <span className="mr-1">({reportsCount})</span>
      )}
    </span>
  );
}
