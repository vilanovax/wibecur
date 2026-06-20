import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { shouldGracefulDbFallback } from '@/lib/db-errors';
import { resolveSessionUserId } from '@/lib/api-db';
import { fetchSharedLists } from '@/lib/list-collaboration';

/** GET /api/user/shared-lists */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await dbQuery(() => fetchSharedLists(userId, { page, limit }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (shouldGracefulDbFallback(error)) {
      return NextResponse.json({
        success: true,
        data: {
          lists: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        },
      });
    }
    console.error('GET shared-lists:', error);
    return NextResponse.json({ success: false, error: 'خطا در دریافت لیست‌های مشترک' }, { status: 500 });
  }
}
