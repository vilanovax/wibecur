'use client';

import Link from 'next/link';
import { AlertTriangle, ExternalLink, Eye, ShieldCheck } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
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
  onUnrestrict?: (userId: string) => void;
  liftingUserId?: string | null;
};

function riskLevel(count: number, penalty: number): 'high' | 'mid' | 'low' {
  if (count >= 10 || penalty >= 15) return 'high';
  if (count >= 5 || penalty >= 8) return 'mid';
  return 'low';
}

export default function ViolationsTable({
  violations,
  onViewDetails,
  onUnrestrict,
  liftingUserId = null,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
      <table className="w-full min-w-180" dir="rtl">
        <thead className="bg-(--color-bg) border-b border-(--color-border)">
          <tr>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary">
              کاربر
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary w-24">
              تخلف
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary w-28">
              امتیاز منفی
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary w-24">
              وضعیت
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary">
              آخرین تخلف
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary hidden sm:table-cell">
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
                ? 'border-r-4 border-r-rose-500 bg-rose-50/50 dark:bg-rose-900/20'
                : risk === 'mid'
                  ? 'border-r-4 border-r-amber-500 bg-amber-50/40 dark:bg-amber-900/20'
                  : 'hover:bg-(--color-bg)';

            return (
              <tr
                key={v.id}
                className={`border-b border-(--color-border-muted) transition-colors ${rowAccent}`}
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
                      <p className="text-sm font-medium text-(--color-text) truncate">
                        {v.user.name || 'بدون نام'}
                      </p>
                      <p className="text-xs text-wibe-secondary truncate">
                        {v.user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {v.violationCount.toLocaleString('fa-IR')}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-bold tabular-nums">
                    {v.totalPenaltyScore.toLocaleString('fa-IR')}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <CommentRestrictionStatusBadge status={v.commentStatus} />
                </td>
                <td className="px-3 py-2.5 text-xs text-wibe-secondary whitespace-nowrap">
                  {formatRelativeTime(v.lastViolationDate)}
                </td>
                <td className="px-3 py-2.5 text-xs text-wibe-secondary whitespace-nowrap hidden sm:table-cell">
                  {formatRelativeTime(v.user.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-0.5">
                    {(v.commentStatus === 'restricted' || v.commentStatus === 'banned') &&
                      onUnrestrict && (
                        <button
                          type="button"
                          onClick={() => onUnrestrict(v.user.id)}
                          disabled={liftingUserId === v.user.id}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 inline-flex disabled:opacity-50"
                          title="رفع محدودیت کامنت"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() => onViewDetails(v.user.id)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 inline-flex"
                      title="جزئیات و محدودیت"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/admin/users?id=${v.user.id}`}
                      className="p-1.5 rounded-lg text-wibe-secondary hover:bg-(--color-bg) inline-flex"
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
