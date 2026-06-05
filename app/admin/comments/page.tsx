import { requireAdmin } from '@/lib/auth';
import { getCommentsHubStats } from '@/lib/admin/comments-hub-stats';
import { getCommentsHubPriorityItems } from '@/lib/admin/comments-hub-priority';
import CommentsHubDashboard from '@/components/admin/comments/CommentsHubDashboard';

export default async function CommentsHubPage() {
  await requireAdmin();
  const [stats, priorityItems] = await Promise.all([
    getCommentsHubStats(),
    getCommentsHubPriorityItems(5),
  ]);
  return (
    <CommentsHubDashboard stats={stats} priorityItems={priorityItems} />
  );
}
