import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { shouldGracefulDbFallback } from '@/lib/db-errors';
import { fetchUserBookmarks } from '@/lib/user-bookmarks';

function emptyBookmarksResponse(page: number, limit: number) {
  return NextResponse.json({
    success: true,
    data: {
      bookmarks: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    },
  });
}

/** GET /api/user/bookmarks */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const result = await dbQuery(() => fetchUserBookmarks(userId, { page, limit }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    if (shouldGracefulDbFallback(error)) {
      console.warn('Bookmarks DB fallback:', (error as Error)?.message);
      return emptyBookmarksResponse(page, limit);
    }
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت ذخیره‌ها' },
      { status: 500 }
    );
  }
}
