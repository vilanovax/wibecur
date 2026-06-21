import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getCommentsHubStats } from '@/lib/admin/comments-hub-stats';
import { getSuggestionsStats } from '@/lib/admin/suggestions-stats';
import { getTrashCounts } from '@/lib/admin/trash-hub';

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getCommentsHubStats();
    const suggestionStats = await getSuggestionsStats();
    const trashCounts = await getTrashCounts();
    const commentsAction =
      stats.comments.pending +
      stats.commentReports.open +
      stats.itemReportsOpen;

    return NextResponse.json({
      success: true,
      data: {
        commentsPending: stats.comments.pending,
        commentReportsOpen: stats.commentReports.open,
        commentsAction,
        itemReportsOpen: stats.itemReportsOpen,
        suggestionsPending: suggestionStats.totalPending,
        trashTotal: trashCounts.total,
      },
    });
  } catch (error: unknown) {
    console.error('sidebar-badges:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
