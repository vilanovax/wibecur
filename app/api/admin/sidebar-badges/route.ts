import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getCommentsHubStats } from '@/lib/admin/comments-hub-stats';

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getCommentsHubStats();
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
