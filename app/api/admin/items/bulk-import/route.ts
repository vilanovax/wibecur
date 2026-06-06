import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { ensureImageInLiara } from '@/lib/object-storage';
import { notifyListBookmarkers } from '@/lib/utils/notifications';
import { extractImdbIdFromUrl, normalizeBulkImportMetadata } from '@/lib/admin/bulk-import';
import { resolveBulkImportMatch } from '@/lib/admin/bulk-import-resolve';
import {
  addCatalogItemToList,
  createCatalogItem,
  updateCatalogItem,
} from '@/lib/catalog-items';
import type { BulkImportPayloadItem } from '@/lib/admin/bulk-import';

type ImportResult = {
  index: number;
  title: string;
  status: 'created' | 'linked' | 'updated' | 'error';
  catalogItemId?: string;
  itemId?: string;
  message?: string;
  listCount?: number;
};

/** POST /api/admin/items/bulk-import — یک موجودیت کاتالوگ، چند جایگاه لیست */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { listId, items } = body as {
      listId?: string;
      items?: BulkImportPayloadItem[];
    };

    if (!listId?.trim()) {
      return NextResponse.json({ error: 'لیست الزامی است' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'حداقل یک آیتم لازم است' }, { status: 400 });
    }
    if (items.length > 100) {
      return NextResponse.json({ error: 'حداکثر ۱۰۰ آیتم در هر import' }, { status: 400 });
    }

    const list = await prisma.lists.findUnique({
      where: { id: listId },
      include: { categories: true },
    });

    if (!list || list.deletedAt) {
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
    }
    if (!list.categories) {
      return NextResponse.json({ error: 'دستهٔ لیست یافت نشد' }, { status: 400 });
    }

    const categorySlug = list.categories.slug;
    const results: ImportResult[] = [];
    let created = 0;
    let linked = 0;
    let updated = 0;
    let placementsAdded = 0;

    const maxOrderAgg = await prisma.items.aggregate({
      where: { listId },
      _max: { order: true },
    });
    let nextOrder = (maxOrderAgg._max.order ?? -1) + 1;

    for (let index = 0; index < items.length; index++) {
      const row = items[index];
      const title = row.title?.trim();

      if (!title) {
        results.push({ index, title: '—', status: 'error', message: 'عنوان خالی' });
        continue;
      }

      try {
        const metaInput = normalizeBulkImportMetadata(
          categorySlug,
          (row.metadata ?? {}) as Record<string, unknown>,
          row.externalUrl
        );
        const imdbFromUrl = extractImdbIdFromUrl(row.externalUrl);
        if (imdbFromUrl && !metaInput.imdbId) metaInput.imdbId = imdbFromUrl;
        const metadataValidation = validateMetadata(categorySlug, metaInput);
        if (!metadataValidation.success) {
          results.push({
            index,
            title,
            status: 'error',
            message: metadataValidation.error,
          });
          continue;
        }

        const meta = metadataValidation.data || {};
        const match = await resolveBulkImportMatch(prisma, categorySlug, listId, {
          title,
          metadata: meta,
        });

        const imageUrlRaw = row.imageUrl?.trim() || null;
        let finalImage: string | undefined;
        if (imageUrlRaw) {
          finalImage = (await ensureImageInLiara(imageUrlRaw, 'items')) ?? undefined;
        }

        let catalogId = match.catalogId;

        if (!catalogId) {
          const catalog = await createCatalogItem(prisma, {
            title,
            description: row.description?.trim() || null,
            imageUrl: finalImage ?? null,
            externalUrl: row.externalUrl?.trim() || null,
            categorySlug,
            metadata: meta,
          });
          catalogId = catalog.id;
          created++;
        } else {
          await updateCatalogItem(prisma, catalogId, {
            title,
            description: row.description?.trim() || null,
            ...(finalImage !== undefined && { imageUrl: finalImage }),
            externalUrl: row.externalUrl?.trim() || null,
            categorySlug,
            metadata: meta,
          });
        }

        if (match.inTargetList) {
          updated++;
          results.push({
            index,
            title,
            status: 'updated',
            catalogItemId: catalogId,
            listCount: match.listCount,
            message: `از قبل در این لیست بود — دادهٔ مشترک کاتالوگ به‌روز شد (${match.listCount.toLocaleString('fa-IR')} لیست)`,
          });
          continue;
        }

        const order = row.order ?? nextOrder++;
        const item = await addCatalogItemToList(prisma, {
          catalogItemId: catalogId,
          listId,
          order,
        });

        placementsAdded++;
        if (match.kind === 'existing_catalog') {
          linked++;
          results.push({
            index,
            title,
            status: 'linked',
            catalogItemId: catalogId,
            itemId: item.id,
            listCount: match.listCount,
            message: `موجود در ${match.listCount.toLocaleString('fa-IR')} لیست دیگر — فقط جایگاه جدید اضافه شد`,
          });
        } else {
          results.push({
            index,
            title,
            status: 'created',
            catalogItemId: catalogId,
            itemId: item.id,
            message: 'موجودیت جدید در کاتالوگ و این لیست',
          });
        }
      } catch (err: unknown) {
        results.push({
          index,
          title,
          status: 'error',
          message: err instanceof Error ? err.message : 'خطای ناشناخته',
        });
      }
    }

    if (placementsAdded > 0) {
      notifyListBookmarkers(listId, `${placementsAdded} آیتم جدید`, list.title).catch(console.error);
    }

    return NextResponse.json({
      imported: placementsAdded,
      created,
      linked,
      updated,
      total: items.length,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در import';
    console.error('bulk-import:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
