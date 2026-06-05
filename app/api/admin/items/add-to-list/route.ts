import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addCatalogItemToList } from '@/lib/catalog-items';
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
      listNote,
      commentsEnabled,
      maxComments,
    } = body as {
      catalogItemId?: string;
      listId?: string;
      order?: number;
      listNote?: string;
      commentsEnabled?: boolean;
      maxComments?: number | null;
    };

    if (!catalogItemId || !listId) {
      return NextResponse.json(
        { error: 'شناسه کاتالوگ و لیست الزامی است' },
        { status: 400 }
      );
    }

    const item = await addCatalogItemToList(prisma, {
      catalogItemId,
      listId,
      order,
      listNote,
      commentsEnabled,
      maxComments,
    });

    const listTitle = item.lists?.title ?? 'لیست';
    notifyListBookmarkers(listId, item.title, listTitle).catch(console.error);

    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در افزودن به لیست';
    const status = message.includes('قبلاً') ? 409 : 500;
    console.error('add-to-list:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
