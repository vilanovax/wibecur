import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addCatalogItemToList } from '@/lib/catalog-items';
import { updateItemTip } from '@/lib/admin/item-tips-server';
import { notifyListBookmarkers } from '@/lib/utils/notifications';

/** POST /api/admin/items/add-to-list — افزودن آیتم کاتالوگ به لیست (بدون کپی محتوا) */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      catalogItemId,
      listId,
      order,
      position,
      listNote,
      tip,
      commentsEnabled,
      maxComments,
    } = body as {
      catalogItemId?: string;
      listId?: string;
      order?: number;
      /** جایگاه ۱‌پایه در لیست (۱ = اول). اگر نباشد، ته لیست. */
      position?: number;
      listNote?: string;
      tip?: string | null;
      commentsEnabled?: boolean;
      maxComments?: number | null;
    };

    if (!catalogItemId || !listId) {
      return NextResponse.json(
        { error: 'شناسه کاتالوگ و لیست الزامی است' },
        { status: 400 }
      );
    }

    let resolvedOrder = order;
    if (
      resolvedOrder === undefined &&
      typeof position === 'number' &&
      Number.isFinite(position)
    ) {
      resolvedOrder = Math.max(0, Math.floor(position) - 1);
    }

    const item = await addCatalogItemToList(prisma, {
      catalogItemId,
      listId,
      order: resolvedOrder,
      listNote,
      commentsEnabled,
      maxComments,
    });

    const tipText = typeof tip === 'string' ? tip.trim() : '';
    if (tipText) {
      await updateItemTip(prisma, item.id, tipText);
    }

    const listTitle = item.lists?.title ?? 'لیست';
    const category = item.lists?.categories;
    notifyListBookmarkers(listId, {
      itemCount: 1,
      categorySlug: category?.slug,
      categoryName: category?.name,
      listTitle,
    }).catch(console.error);

    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در افزودن به لیست';
    const status = message.includes('قبلاً') ? 409 : 500;
    console.error('add-to-list:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
