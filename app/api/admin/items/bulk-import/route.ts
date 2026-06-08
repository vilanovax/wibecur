import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { notifyListBookmarkers } from '@/lib/utils/notifications';
import { extractImdbIdFromUrl, normalizeBulkImportMetadata } from '@/lib/admin/bulk-import';
import {
  createBulkImportImageContext,
  resolveBulkImportImageForStorage,
  type BulkImportImageContext,
} from '@/lib/admin/bulk-import-image';
import {
  resolveBulkImportMatchesBatch,
  resolveBulkImportCatalogId,
} from '@/lib/admin/bulk-import-resolve';
import {
  addCatalogItemToList,
  createCatalogItem,
  createLightweightListItem,
  isCatalogInList,
} from '@/lib/catalog-items';
import {
  extractBulkImportEntryKind,
  isBulkImportLightweightRow,
} from '@/lib/admin/bulk-import';
import {
  isLightweightEntryKind,
  isMixedListCategory,
} from '@/lib/list-entry';
import type { BulkImportPayloadItem } from '@/lib/admin/bulk-import';

type ImportResult = {
  index: number;
  title: string;
  status: 'created' | 'linked' | 'updated' | 'lightweight' | 'error';
  catalogItemId?: string;
  itemId?: string;
  message?: string;
  listCount?: number;
};

const IMPORT_CONCURRENCY = 5;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

async function importOneRow(
  index: number,
  row: BulkImportPayloadItem,
  assignedOrder: number,
  ctx: {
    categorySlug: string;
    listId: string;
    imageCtx: BulkImportImageContext;
    match: Awaited<ReturnType<typeof resolveBulkImportMatchesBatch>>[number];
  }
): Promise<ImportResult & { placementAdded?: boolean; created?: boolean; linked?: boolean; updated?: boolean; lightweight?: boolean }> {
  const titleRaw = row.title?.trim();
  const descRaw = row.description?.trim();
  const title = titleRaw || (descRaw ? descRaw.slice(0, 80).trim() : '');
  if (!title) {
    return { index, title: '—', status: 'error', message: 'عنوان خالی' };
  }

  try {
    const metaInput = normalizeBulkImportMetadata(
      ctx.categorySlug,
      (row.metadata ?? {}) as Record<string, unknown>,
      row.externalUrl
    );
    const entryKind = extractBulkImportEntryKind(
      ctx.categorySlug,
      metaInput,
      row.entryKind ?? metaInput.entryKind
    );
    if (entryKind) metaInput.entryKind = entryKind;

    const imdbFromUrl = extractImdbIdFromUrl(row.externalUrl);
    if (imdbFromUrl && !metaInput.imdbId) metaInput.imdbId = imdbFromUrl;

    const metadataValidation = validateMetadata(ctx.categorySlug, metaInput);
    if (!metadataValidation.success) {
      return {
        index,
        title,
        status: 'error',
        message: metadataValidation.error,
      };
    }

    const meta = metadataValidation.data || {};
    const metaRecord = meta as Record<string, unknown>;

    if (
      isMixedListCategory(ctx.categorySlug) &&
      isBulkImportLightweightRow(ctx.categorySlug, {
        metadata: metaRecord,
        entryKind: entryKind ?? metaRecord.entryKind,
      }) &&
      entryKind &&
      isLightweightEntryKind(entryKind)
    ) {
      if (entryKind === 'link' && !row.externalUrl?.trim()) {
        return { index, title, status: 'error', message: 'برای link، externalUrl الزامی است' };
      }

      const order = row.order ?? assignedOrder;
      const item = await createLightweightListItem(prisma, {
        title,
        description: row.description?.trim() || null,
        imageUrl: row.imageUrl?.trim() || null,
        externalUrl: row.externalUrl?.trim() || null,
        listId: ctx.listId,
        order,
        metadata: metaRecord as Prisma.InputJsonValue,
        entryKind,
      });

      return {
        index,
        title,
        status: 'lightweight',
        itemId: item.id,
        placementAdded: true,
        lightweight: true,
        message: 'ورودی سبک (بدون کاتالوگ)',
      };
    }

    const match = ctx.match;

    let catalogId =
      match.catalogId ??
      (await resolveBulkImportCatalogId(prisma, ctx.categorySlug, row));

    const existingCatalog = !!catalogId;

    if (!catalogId) {
      let finalImage: string | null = null;
      if (row.imageUrl?.trim()) {
        finalImage =
          (await resolveBulkImportImageForStorage(
            row.imageUrl,
            meta as Record<string, unknown>,
            'items',
            ctx.imageCtx
          )) ?? null;
      }

      const catalog = await createCatalogItem(prisma, {
        title,
        description: row.description?.trim() || null,
        imageUrl: finalImage,
        externalUrl: row.externalUrl?.trim() || null,
        categorySlug: ctx.categorySlug,
        metadata: meta,
      });
      catalogId = catalog.id;
    }

    const inTargetList = await isCatalogInList(prisma, catalogId, ctx.listId);
    if (inTargetList) {
      return {
        index,
        title,
        status: 'updated',
        catalogItemId: catalogId,
        listCount: match.listCount,
        updated: true,
        message: `از قبل در این لیست است — دادهٔ اصلی کاتالوگ حفظ شد`,
      };
    }

    const order = row.order ?? assignedOrder;
    const item = await addCatalogItemToList(prisma, {
      catalogItemId: catalogId,
      listId: ctx.listId,
      order,
    });

    if (existingCatalog) {
      const listCount = match.listCount > 0 ? match.listCount : undefined;
      return {
        index,
        title,
        status: 'linked',
        catalogItemId: catalogId,
        itemId: item.id,
        listCount,
        placementAdded: true,
        linked: true,
        message:
          listCount != null
            ? `کاتالوگ موجود — با دادهٔ اصلی DB به این لیست اضافه شد (${listCount.toLocaleString('fa-IR')} لیست دیگر)`
            : 'کاتالوگ موجود — با دادهٔ اصلی DB به این لیست اضافه شد',
      };
    }

    return {
      index,
      title,
      status: 'created',
      catalogItemId: catalogId,
      itemId: item.id,
      placementAdded: true,
      created: true,
      message: 'موجودیت جدید در کاتالوگ و این لیست',
    };
  } catch (err: unknown) {
    return {
      index,
      title,
      status: 'error',
      message: err instanceof Error ? err.message : 'خطای ناشناخته',
    };
  }
}

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
    const maxOrderAgg = await prisma.items.aggregate({
      where: { listId },
      _max: { order: true },
    });
    let orderCursor = (maxOrderAgg._max.order ?? -1) + 1;
    const assignedOrders = items.map((row) => row.order ?? orderCursor++);
    const imageCtx = await createBulkImportImageContext();
    const matches = await resolveBulkImportMatchesBatch(prisma, categorySlug, listId, items);

    const rowResults = await mapWithConcurrency(
      items,
      IMPORT_CONCURRENCY,
      (row, index) =>
        importOneRow(index, row, assignedOrders[index], {
          categorySlug,
          listId,
          imageCtx,
          match: matches[index],
        })
    );

    let created = 0;
    let linked = 0;
    let updated = 0;
    let lightweight = 0;
    let placementsAdded = 0;
    const results: ImportResult[] = [];

    for (const r of rowResults) {
      if (r.created) created++;
      if (r.linked) linked++;
      if (r.updated) updated++;
      if (r.lightweight) lightweight++;
      if (r.placementAdded) placementsAdded++;
      results.push({
        index: r.index,
        title: r.title,
        status: r.status,
        catalogItemId: r.catalogItemId,
        itemId: r.itemId,
        message: r.message,
        listCount: r.listCount,
      });
    }

    if (placementsAdded > 0) {
      notifyListBookmarkers(listId, `${placementsAdded} آیتم جدید`, list.title).catch(console.error);
    }

    return NextResponse.json({
      imported: placementsAdded,
      created,
      linked,
      updated,
      lightweight,
      total: items.length,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در import';
    console.error('bulk-import:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
