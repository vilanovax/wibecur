'use client';

import Link from 'next/link';
import { AlertTriangle, ExternalLink, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import UserAvatar from '@/components/shared/UserAvatar';
import { CommentRestrictionStatusBadge } from './UserPenaltyBadge';
import type { CommentPermissionStatus } from '@/lib/comment-permission';

export type ViolationRow = {
  id: string;
  violationCount: number;
  totalPenaltyScore: number;
  lastViolationDate: string;
  commentStatus: CommentPermissionStatus;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string;
    commentRestrictedUntil: string | null;
    commentBanReason: string | null;
    isActive: boolean;
  };
};

type Props = {
  violations: ViolationRow[];
  onViewDetails: (userId: string) => void;
};

function riskLevel(count: number, penalty: number): 'high' | 'mid' | 'low' {
  if (count >= 10 || penalty >= 15) return 'high';
  if (count >= 5 || penalty >= 8) return 'mid';
  return 'low';
}

export default function ViolationsTable({ violations, onViewDetails }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <table className="w-full min-w-[720px]" dir="rtl">
        <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
          <tr>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)]">
              کاربر
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)] w-24">
              تخلف
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)] w-28">
              امتیاز منفی
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)] w-24">
              وضعیت
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)]">
              آخرین تخلف
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)] hidden sm:table-cell">
              عضویت
            </th>
            <th className="px-3 py-2.5 w-20" />
          </tr>
        </thead>
        <tbody>
          {violations.map((v) => {
            const risk = riskLevel(v.violationCount, v.totalPenaltyScore);
            const rowAccent =
              risk === 'high'
                ? 'border-r-4 border-r-rose-500 bg-rose-50/50'
                : risk === 'mid'
                  ? 'border-r-4 border-r-amber-500 bg-amber-50/40'
                  : 'hover:bg-[var(--color-bg)]';

            return (
              <tr
                key={v.id}
                className={`border-b border-[var(--color-border-muted)] transition-colors ${rowAccent}`}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserAvatar
                      src={v.user.image}
                      name={v.user.name}
                      email={v.user.email}
                      size={36}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {v.user.name || 'بدون نام'}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {v.user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {v.violationCount.toLocaleString('fa-IR')}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 text-xs font-bold tabular-nums">
                    {v.totalPenaltyScore.toLocaleString('fa-IR')}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <CommentRestrictionStatusBadge status={v.commentStatus} />
                </td>
                <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                  {formatDistanceToNow(new Date(v.lastViolationDate), {
                    addSuffix: true,
                    locale: faIR,
                  })}
                </td>
                <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)] whitespace-nowrap hidden sm:table-cell">
                  {formatDistanceToNow(new Date(v.user.createdAt), {
                    addSuffix: true,
                    locale: faIR,
                  })}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onViewDetails(v.user.id)}
                      className="p-1.5 rounded-lg text-[var(--primary)] hover:bg-[var(--primary)]/10 inline-flex"
                      title="جزئیات و محدودیت"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/admin/users?id=${v.user.id}`}
                      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] inline-flex"
                      title="پروفایل کاربر"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
