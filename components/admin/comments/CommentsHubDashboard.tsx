'use client';

import { MessageSquare } from 'lucide-react';
import CommentsSubNav from './CommentsSubNav';
import CommentsHubKpiStrip from './CommentsHubKpiStrip';
import CommentsHubPriorityQueue from './CommentsHubPriorityQueue';
import type { CommentsHubStats } from '@/lib/admin/comments-hub-stats';
import type { HubPriorityItem } from '@/lib/admin/comments-hub-priority';

export default function CommentsHubDashboard({
  stats,
  priorityItems = [],
}: {
  stats: CommentsHubStats;
  priorityItems?: HubPriorityItem[];
}) {
  const navStats = {
    pending: stats.comments.pending,
    commentReportsOpen: stats.commentReports.open,
    itemReportsOpen: stats.itemReportsOpen,
  };

  const actionTotal =
    stats.comments.pending +
    stats.commentReports.open +
    stats.itemReportsOpen;

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center gap-3 text-[var(--color-text)]">
        <span className="p-2.5 rounded-2xl bg-[var(--primary)]/10">
          <MessageSquare className="w-8 h-8 text-[var(--primary)]" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">داشبورد کامنت‌ها</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {actionTotal > 0
              ? `${actionTotal.toLocaleString('fa-IR')} مورد نیازمند اقدام`
              : 'صف بررسی خالی است — همه چیز به‌روز است'}
          </p>
        </div>
      </div>

      <CommentsSubNav stats={navStats} />

      <CommentsHubPriorityQueue items={priorityItems} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          خلاصه وضعیت
        </h2>
        <CommentsHubKpiStrip stats={stats} />
      </section>

      <p className="text-xs text-[var(--color-text-muted)]">
        از نوار بالا برای رفتن به صف کار، ریپورت‌ها یا تنظیم کلمات ممنوع استفاده کنید.
      </p>
    </div>
  );
}
