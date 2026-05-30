import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { shouldGracefulDbFallback } from '@/lib/db-errors';
import { fetchUserLists, type UserListFilter } from '@/lib/user-lists';

function emptyListsResponse(page: number, limit: number) {
  return NextResponse.json({
    success: true,
    data: {
      lists: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    },
  });
}

/** GET /api/user/my-lists */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const filter = (searchParams.get('filter') || 'all') as UserListFilter;

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await dbQuery(() =>
      fetchUserLists(session.user!.id, { page, limit, filter })
    );

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (shouldGracefulDbFallback(error)) {
      console.warn('My-lists DB fallback:', (error as Error)?.message);
      return emptyListsResponse(page, limit);
    }
    console.error('Error fetching user lists:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}
