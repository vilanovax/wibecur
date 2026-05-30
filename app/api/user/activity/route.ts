import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { shouldGracefulDbFallback } from '@/lib/db-errors';
import { fetchUserActivities } from '@/lib/user-activity';

function emptyActivityResponse(limit: number) {
  return NextResponse.json({
    success: true,
    data: { activities: [], total: 0, limit },
  });
}

/** GET /api/user/activity */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await dbQuery(() =>
      fetchUserActivities(session.user!.id, { type, limit })
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    if (shouldGracefulDbFallback(error)) {
      console.warn('Activity DB fallback:', (error as Error)?.message);
      return emptyActivityResponse(limit);
    }
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت فعالیت‌ها' },
      { status: 500 }
    );
  }
}
