import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { resolveSessionUserId } from '@/lib/api-db';
import { getListAccessForUser } from '@/lib/list-collaboration';
import {
  fetchBrowseCategoryCounts,
  fetchBrowsePublicItems,
  fetchBrowseTotals,
  type BrowseItemsAvailability,
  type BrowseItemsSort,
  type ExistingInListKeys,
} from '@/lib/browse-public-items';
import { prisma } from '@/lib/prisma';

async function getExistingKeys(listId: string): Promise<ExistingInListKeys> {
  const items = await prisma.items.findMany({
    where: { listId },
    select: { catalogItemId: true, title: true },
  });
  return {
    catalogItemIds: items
      .map((i) => i.catalogItemId)
      .filter((id): id is string => Boolean(id)),
    titleKeys: items.map((i) => i.title.trim().toLowerCase()).filter(Boolean),
  };
}

/** GET /api/user/lists/[id]/browse-items */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: listId } = await params;
    const list = await prisma.lists.findUnique({
      where: { id: listId },
      select: { id: true, userId: true, deletedAt: true, isActive: true },
    });
    if (!list || !list.isActive || list.deletedAt) {
      return NextResponse.json({ success: false, error: 'لیست یافت نشد' }, { status: 404 });
    }

    const access = await getListAccessForUser(list, userId);
    if (!access.canAddItems) {
      return NextResponse.json({ success: false, error: 'دسترسی مجاز نیست' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || undefined;
    const sourceListId = searchParams.get('sourceListId') || undefined;
    const availability = (searchParams.get('availability') || 'all') as BrowseItemsAvailability;
    const sort = (searchParams.get('sort') || 'newest') as BrowseItemsSort;
    const includeMeta = searchParams.get('meta') === '1';

    const existing = await getExistingKeys(listId);

    const result = await dbQuery(() =>
      fetchBrowsePublicItems({
        page,
        limit,
        search,
        categoryId: categoryId && categoryId !== 'all' ? categoryId : undefined,
        sourceListId: sourceListId && sourceListId !== 'all' ? sourceListId : undefined,
        availability:
          availability === 'available' || availability === 'in-list' ? availability : 'all',
        sort,
        existing,
      })
    );

    let meta;
    if (includeMeta && page === 1) {
      const [totals, categoryCounts] = await Promise.all([
        fetchBrowseTotals(existing),
        fetchBrowseCategoryCounts(),
      ]);
      meta = { totals, categoryCounts };
    }

    return NextResponse.json({
      success: true,
      data: {
        items: result.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
        pagination: result.pagination,
        meta,
      },
    });
  } catch (error) {
    console.error('browse-items:', error);
    return NextResponse.json({ success: false, error: 'خطا در بارگذاری آیتم‌ها' }, { status: 500 });
  }
}
