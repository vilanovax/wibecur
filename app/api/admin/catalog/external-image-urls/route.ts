import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import {
  listCatalogExternalImageItems,
  listCatalogMissingPosterItems,
} from '@/lib/catalog-items';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import { catalogCategoryLabel } from '@/lib/catalog-display';

/** GET /api/admin/catalog/external-image-urls?categorySlug=&listId=&multiList=1 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const categorySlug = request.nextUrl.searchParams.get('categorySlug')?.trim() || undefined;
    const listId = request.nextUrl.searchParams.get('listId')?.trim() || undefined;
    const multiListOnly = request.nextUrl.searchParams.get('multiList') === '1';

    const [items, missingPosters, storage, list] = await dbQuery(() =>
      Promise.all([
        listCatalogExternalImageItems(prisma, {
          categorySlug,
          listId,
          multiListOnly,
        }),
        listCatalogMissingPosterItems(prisma, {
          categorySlug,
          listId,
          multiListOnly,
        }),
        checkObjectStorageReady(),
        listId
          ? prisma.lists.findUnique({
              where: { id: listId },
              select: { id: true, title: true, slug: true },
            })
          : Promise.resolve(null),
      ])
    );

    const mappedItems = items.map((item, index) => ({
      id: item.id,
      title: item.title,
      order: index,
      listId: listId || '',
      listTitle: item.listCount > 0 ? `${item.listCount.toLocaleString('fa-IR')} لیست` : '—',
      imageUrl: item.imageUrl,
      host: item.host,
      listCount: item.listCount,
      isHidden: item.isHidden,
    }));

    return NextResponse.json({
      scope: 'catalog' as const,
      filters: {
        categorySlug: categorySlug || null,
        categoryLabel: categorySlug
          ? catalogCategoryLabel(categorySlug === '__none__' ? null : categorySlug)
          : null,
        listId: listId || null,
        listTitle: list?.title || null,
        multiListOnly,
      },
      items: mappedItems,
      total: mappedItems.length,
      missingPosters: missingPosters.map((item, index) => ({
        id: item.id,
        title: item.title,
        imdbId: item.imdbId,
        order: index,
        listTitle:
          item.listCount > 0 ? `${item.listCount.toLocaleString('fa-IR')} لیست` : '—',
        listCount: item.listCount,
        isHidden: item.isHidden,
      })),
      missingPosterTotal: missingPosters.length,
      storage,
      liara: storage,
    });
  } catch (error: unknown) {
    console.error('catalog external-image-urls error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در دریافت لیست' },
      { status: 500 }
    );
  }
}
