import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId } from '@/lib/api-db';
import { dbQuery } from '@/lib/db';
import { browseItemsForProfilePicks, ProfilePickError } from '@/lib/profile-picks';

/** GET /api/user/profile-picks/browse-items?category=...&q=...&page=... */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category')?.trim() ?? '';
    if (!categorySlug) {
      return NextResponse.json({ success: false, error: 'دسته الزامی است' }, { status: 400 });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const search = searchParams.get('q') || searchParams.get('search') || '';

    const result = await dbQuery(() =>
      browseItemsForProfilePicks({ userId, categorySlug, page, limit, search })
    );

    return NextResponse.json({
      success: true,
      data: {
        category: result.category,
        items: result.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
        pagination: result.pagination,
      },
    });
  } catch (error) {
    if (error instanceof ProfilePickError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error('profile-picks browse-items:', error);
    return NextResponse.json({ success: false, error: 'خطا در بارگذاری آیتم‌ها' }, { status: 500 });
  }
}
