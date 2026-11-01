'use client';

import { formatRelativeTime } from '@/lib/format-relative-time';
import type { ReportGroup } from '@/lib/admin/comments-reports-intelligence';
import { UserPenaltyBadge } from '@/components/admin/comments/UserPenaltyBadge';

type Props = {
  groups: ReportGroup[];
  activeCommentId: string | null;
  onSelect: (group: ReportGroup) => void;
  filterBadWords?: (text: string) => string;
};

export default function ReportsTable({
  groups,
  activeCommentId,
  onSelect,
  filterBadWords,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
      <table className="w-full min-w-160" dir="rtl">
        <thead className="bg-(--color-bg) border-b border-(--color-border)">
          <tr>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary w-16">
              ریپورت
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary">
              کامنت
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary">
              آیتم
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary">
              زمان
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary">
              وضعیت
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const active = activeCommentId === group.comment.id;
            const openCount = group.reports.filter((r) => !r.resolved).length;
            const display = group.comment.isFiltered && filterBadWords
              ? filterBadWords(group.comment.content)
              : group.comment.content;
            const preview =
              display.length > 80 ? display.slice(0, 80) + '…' : display;

            return (
              <tr
                key={group.comment.id}
                onClick={() => onSelect(group)}
                className={`border-b border-(--color-border-muted) cursor-pointer transition-colors ${
                  active
                    ? 'bg-primary/8 ring-1 ring-inset ring-(--primary)/30'
                    : 'hover:bg-(--color-bg)'
                } ${openCount > 0 ? 'border-r-4 border-r-rose-500' : ''}`}
              >
                <td className="px-3 py-2.5">
                  <span className="inline-flex min-w-8 justify-center px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 text-xs font-bold tabular-nums">
                    {group.reportCount.toLocaleString('fa-IR')}
                  </span>
                </td>
                <td className="px-3 py-2.5 max-w-70">
                  <p className="text-sm text-(--color-text) line-clamp-2">{preview}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <p className="text-xs text-wibe-secondary truncate">
                      {group.comment.users.name || group.comment.users.email}
                    </p>
                    {group.comment.userModeration && (
                      <UserPenaltyBadge
                        totalPenaltyScore={group.comment.userModeration.totalPenaltyScore}
                        status={group.comment.userModeration.status}
                        compact
                      />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-sm text-wibe-secondary max-w-35 truncate">
                  {group.comment.items.title}
                </td>
                <td className="px-3 py-2.5 text-xs text-wibe-secondary whitespace-nowrap">
                  {formatRelativeTime(group.comment.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  {group.comment.isApproved ? (
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">
                      تایید
                    </span>
                  ) : openCount > 0 ? (
                    <span className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-lg">
                      باز
                    </span>
                  ) : (
                    <span className="text-xs text-wibe-secondary bg-(--color-bg) px-2 py-0.5 rounded-lg">
                      حل‌شده
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
