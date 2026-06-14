import type { ReportGroup } from '@/lib/admin/comments-reports-intelligence';
import type { CommentRowData } from '@/components/admin/comments/CommentRow';

export function reportGroupToCommentRow(group: ReportGroup): CommentRowData {
  const { comment, reportCount } = group;
  return {
    id: comment.id,
    content: comment.content,
    isFiltered: comment.isFiltered,
    isApproved: comment.isApproved,
    likeCount: comment.likeCount,
    createdAt: comment.createdAt,
    deletedAt: comment.deletedAt,
    users: {
      id: comment.users.id,
      name: comment.users.name,
      email: comment.users.email,
      image: null,
    },
    items: comment.items,
    _count: { comment_reports: reportCount },
    ...(comment.userModeration ? { userModeration: comment.userModeration } : {}),
  };
}
