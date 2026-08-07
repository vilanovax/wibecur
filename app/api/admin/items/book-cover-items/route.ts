import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { listBookCoverItems } from '@/lib/book-cover-items';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';

/** GET /api/admin/items/book-cover-items?listId= | ?categoryId= */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const listId = request.nextUrl.searchParams.get('listId')?.trim();
    const categoryId = request.nextUrl.searchParams.get('categoryId')?.trim();

    if (!listId && !categoryId) {
      return NextResponse.json(
        { error: 'listId یا categoryId الزامی است' },
        { status: 400 }
      );
    }

    if (listId && categoryId) {
      return NextResponse.json(
        { error: 'فقط یکی از listId یا categoryId را ارسال کنید' },
        { status: 400 }
      );
    }

    if (listId) {
      const list = await dbQuery(() =>
        prisma.lists.findUnique({
          where: { id: listId },
          select: {
            id: true,
            title: true,
            slug: true,
            categories: { select: { id: true, name: true, slug: true } },
          },
        })
      );

      if (!list) {
        return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
      }

      const [items, storage] = await dbQuery(() =>
        Promise.all([
          listBookCoverItems(prisma, { listId }),
          checkObjectStorageReady(),
        ])
      );

      return NextResponse.json({
        scope: 'list' as const,
        list,
        items,
        total: items.length,
        storage,
      });
    }

    const category = await dbQuery(() =>
      prisma.categories.findUnique({
        where: { id: categoryId! },
        select: { id: true, name: true, slug: true, icon: true },
      })
    );

    if (!category) {
      return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 });
    }

    const [items, storage] = await dbQuery(() =>
      Promise.all([
        listBookCoverItems(prisma, { categoryId: categoryId! }),
        checkObjectStorageReady(),
      ])
    );

    return NextResponse.json({
      scope: 'category' as const,
      category,
      items,
      total: items.length,
      storage,
    });
  } catch (error: unknown) {
    console.error('book-cover-items error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در دریافت لیست' },
      { status: 500 }
    );
  }
}
