import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import {
  externalImageHost,
  getItemEffectiveImageUrl,
  isExternalDirectImageUrl,
} from '@/lib/item-image-storage';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';

type ItemRow = {
  id: string;
  title: string;
  order: number;
  imageUrl: string | null;
  catalog_items: { imageUrl: string | null } | null;
  lists: { id: string; title: string };
};

function mapExternalImageItems(rows: ItemRow[]) {
  return rows
    .map((row) => {
      const imageUrl = getItemEffectiveImageUrl({
        imageUrl: row.imageUrl,
        catalogImageUrl: row.catalog_items?.imageUrl,
      });
      return {
        id: row.id,
        title: row.title,
        order: row.order,
        listId: row.lists.id,
        listTitle: row.lists.title,
        imageUrl,
        host: imageUrl ? externalImageHost(imageUrl) : '',
      };
    })
    .filter((row) => isExternalDirectImageUrl(row.imageUrl));
}

/** GET /api/admin/items/external-image-urls?listId= | ?categoryId= */
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
          select: { id: true, title: true, slug: true },
        })
      );

      if (!list) {
        return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
      }

      const [rows, liara] = await dbQuery(() =>
        Promise.all([
          prisma.items.findMany({
            where: { listId },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              order: true,
              imageUrl: true,
              catalog_items: { select: { imageUrl: true } },
              lists: { select: { id: true, title: true } },
            },
          }),
          checkObjectStorageReady(),
        ])
      );

      const items = mapExternalImageItems(rows);

      return NextResponse.json({
        scope: 'list' as const,
        list,
        items,
        total: items.length,
        storage: liara,
        liara,
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

    const [rows, liara] = await dbQuery(() =>
      Promise.all([
        prisma.items.findMany({
          where: { lists: { categoryId: categoryId! } },
          orderBy: [{ lists: { title: 'asc' } }, { order: 'asc' }],
          select: {
            id: true,
            title: true,
            order: true,
            imageUrl: true,
            catalog_items: { select: { imageUrl: true } },
            lists: { select: { id: true, title: true } },
          },
        }),
        checkObjectStorageReady(),
      ])
    );

    const items = mapExternalImageItems(rows);

    return NextResponse.json({
      scope: 'category' as const,
      category,
      items,
      total: items.length,
      storage: liara,
      liara,
    });
  } catch (error: unknown) {
    console.error('external-image-urls error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در دریافت لیست' },
      { status: 500 }
    );
  }
}
