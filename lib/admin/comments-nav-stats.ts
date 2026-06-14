import type { CommentsHubStats } from '@/lib/admin/comments-hub-stats';
import type { CommentsNavStats } from '@/components/admin/comments/CommentsSubNav';

export function buildCommentsNavStats(hub: CommentsHubStats): CommentsNavStats {
  return {
    pending: hub.comments.pending,
    commentReportsOpen: hub.commentReports.open,
    itemReportsOpen: hub.itemReportsOpen,
    violationsRestricted: hub.violations.restrictedUsers,
  };
}
