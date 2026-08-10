import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { getCachedCommentsHubStats } from '@/lib/admin/comments-hub-stats-cached';
import { getCachedCommentsHubPriorityItems } from '@/lib/admin/comments-hub-priority-cached';
import CommentsHubDashboard from '@/components/admin/comments/CommentsHubDashboard';

function CommentsHubSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="h-16 rounded-2xl bg-[var(--color-border-muted)]" />
      <div className="h-12 rounded-xl bg-[var(--color-border-muted)]" />
      <div className="h-48 rounded-2xl bg-[var(--color-border-muted)]" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-[var(--color-border-muted)]"
          />
        ))}
      </div>
    </div>
  );
}

async function CommentsHubData() {
  const [stats, priorityItems] = await Promise.all([
    getCachedCommentsHubStats(),
    getCachedCommentsHubPriorityItems(5),
  ]);
  return (
    <CommentsHubDashboard stats={stats} priorityItems={priorityItems} />
  );
}

export default async function CommentsHubPage() {
  await requireAdmin();
  return (
    <Suspense fallback={<CommentsHubSkeleton />}>
      <CommentsHubData />
    </Suspense>
  );
}
