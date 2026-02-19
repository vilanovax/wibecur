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
    className: 'bg-emerald-100 text-emerald-700',
  },
  PENDING: {
    label: 'در انتظار بررسی',
    className: 'bg-amber-100 text-amber-700',
  },
  REJECTED: {
    label: 'رد شده',
    className: 'bg-rose-100 text-rose-700',
  },
  FLAGGED: {
    label: 'Flagged',
    className: 'bg-orange-100 text-orange-700',
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
