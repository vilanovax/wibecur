import { requireAdmin } from '@/lib/auth';
import { getCachedCommentsHubStats } from '@/lib/admin/comments-hub-stats-cached';
import { getCachedCommentsHubPriorityItems } from '@/lib/admin/comments-hub-priority-cached';
import CommentsHubDashboard from '@/components/admin/comments/CommentsHubDashboard';

export default async function CommentsHubPage() {
  await requireAdmin();
  const [stats, priorityItems] = await Promise.all([
    getCachedCommentsHubStats(),
    getCachedCommentsHubPriorityItems(5),
  ]);
  return (
    <CommentsHubDashboard stats={stats} priorityItems={priorityItems} />
  );
}
