'use client';

import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import type { ReportGroup } from '@/lib/admin/comments-reports-intelligence';

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
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <table className="w-full min-w-[640px]" dir="rtl">
        <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
          <tr>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)] w-16">
              ریپورت
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)]">
              کامنت
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)]">
              آیتم
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)]">
              زمان
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-text-muted)]">
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
                className={`border-b border-[var(--color-border-muted)] cursor-pointer transition-colors ${
                  active
                    ? 'bg-[var(--primary)]/8 ring-1 ring-inset ring-[var(--primary)]/30'
                    : 'hover:bg-[var(--color-bg)]'
                } ${openCount > 0 ? 'border-r-4 border-r-rose-500' : ''}`}
              >
                <td className="px-3 py-2.5">
                  <span className="inline-flex min-w-[2rem] justify-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold tabular-nums">
                    {group.reportCount.toLocaleString('fa-IR')}
                  </span>
                </td>
                <td className="px-3 py-2.5 max-w-[280px]">
                  <p className="text-sm text-[var(--color-text)] line-clamp-2">{preview}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                    {group.comment.users.name || group.comment.users.email}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-sm text-[var(--color-text-muted)] max-w-[140px] truncate">
                  {group.comment.items.title}
                </td>
                <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                  {formatDistanceToNow(new Date(group.comment.createdAt), {
                    addSuffix: true,
                    locale: faIR,
                  })}
                </td>
                <td className="px-3 py-2.5">
                  {group.comment.isApproved ? (
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      تایید
                    </span>
                  ) : openCount > 0 ? (
                    <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg">
                      باز
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] px-2 py-0.5 rounded-lg">
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
