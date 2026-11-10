import type { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { notifyListBookmarkers } from '@/lib/utils/notifications';
import { extractImdbIdFromUrl, normalizeBulkImportMetadata } from '@/lib/admin/bulk-import';
import {
  createBulkImportImageContext,
  resolveBulkImportImageForStorage,
  type BulkImportImageContext,
} from '@/lib/admin/bulk-import-image';
import {
  isStrongCatalogExternalKey,
  resolveBulkImportMatchesBatch,
  resolveBulkImportCatalogId,
} from '@/lib/admin/bulk-import-resolve';
import {
  addCatalogItemToList,
  buildCatalogExternalKey,
  createCatalogItem,
  createLightweightListItem,
  isCatalogInList,
  updateCatalogItem,
  updateLightweightListItem,
} from '@/lib/catalog-items';
import {
  catalogTitlesMatch,
  normalizeSuggestionTitle,
} from '@/lib/suggestion-utils';
import {
  carryCatalogPlacementMetadata,
  extractBulkImportEntryKind,
  isBulkImportLightweightRow,
  mergeItemTipIntoMetadata,
  resolveBulkImportLiveItemId,
} from '@/lib/admin/bulk-import';
import {
  isLightweightEntryKind,
  isMixedListCategory,
  parseEntryKind,
} from '@/lib/list-entry';
import type { BulkImportPayloadItem } from '@/lib/admin/bulk-import';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import {
  revalidateListDetailCache,
  revalidateCategoryCache,
  revalidateHomeCache,
} from '@/lib/public-cache';
import { renormalizeListItemOrders } from '@/lib/admin/reorder-list-items';

export type BulkImportRowResult = {
  index: number;
  title: string;
  status: 'created' | 'linked' | 'updated' | 'lightweight' | 'error';
  catalogItemId?: string;
  itemId?: string;
  message?: string;
  listCount?: number;
  placementAdded?: boolean;
  created?: boolean;
  linked?: boolean;
  updated?: boolean;
  lightweight?: boolean;
};

export type BulkImportExecuteResult = {
  imported: number;
  created: number;
  linked: number;
  updated: number;
  lightweight: number;
  total: number;
  results: BulkImportRowResult[];
};

const IMPORT_CONCURRENCY = 5;

/**
 * به ازای هر ردیف JSON یک order یکتا می‌سازد (از max موجود + ۱).
 * اگر در JSON فیلد order باشد فقط برای مرتب‌سازی نسبی ردیف‌ها استفاده می‌شود.
 */
export function assignDenseImportOrders(
  items: BulkImportPayloadItem[],
  currentMaxOrder: number
): number[] {
  const indexed = items.map((row, index) => ({ row, index }));
  const anyExplicit = items.some(
    (r) => r.order != null && Number.isFinite(Number(r.order))
  );
  if (anyExplicit) {
    indexed.sort((a, b) => {
      const ao = a.row.order;
      const bo = b.row.order;
      const aMissing = ao == null || !Number.isFinite(Number(ao));
      const bMissing = bo == null || !Number.isFinite(Number(bo));
      if (aMissing && bMissing) return a.index - b.index;
      if (aMissing) return 1;
      if (bMissing) return -1;
      return Number(ao) - Number(bo) || a.index - b.index;
    });
  }
  let cursor = currentMaxOrder + 1;
  const assigned: number[] = new Array(items.length);
  for (const { index } of indexed) {
    assigned[index] = cursor++;
  }
  return assigned;
}

/** پیدا کردن tip/سبک موجود در همان لیست با عنوان (بدون liveItemId) */
async function findLightweightItemIdByTitle(
  db: PrismaClient,
  listId: string,
  title: string
): Promise<string | null> {
  const candidates = await db.items.findMany({
    where: { listId, deletedAt: null, catalogItemId: null },
    select: { id: true, title: true },
  });
  const hit = candidates.find((c) => catalogTitlesMatch(c.title, title));
  return hit?.id ?? null;
}

/** کلید پایدار برای جلوگیری از ساخت کاتالوگ تکراری در یک batch موازی */
function importCatalogDedupeKey(
  categorySlug: string,
  row: BulkImportPayloadItem,
  match: { externalKey: string | null; catalogId: string | null }
): string {
  const directId = row.catalogItemId?.trim();
  if (directId) return `id:${directId}`;
  if (match.catalogId) return `id:${match.catalogId}`;
  if (match.externalKey) {
    const prefix = isStrongCatalogExternalKey(match.externalKey) ? 'strong' : 'key';
    return `${prefix}:${match.externalKey}`;
  }
  const title = row.title?.trim() || '';
  return `title:${categorySlug}:${normalizeSuggestionTitle(title)}`;
}

async function resolveRowImageForImport(
  row: BulkImportPayloadItem,
  metadata: Record<string, unknown>,
  imageCtx: BulkImportImageContext
): Promise<string | null> {
  if (!row.imageUrl?.trim()) return null;
  return (await resolveBulkImportImageForStorage(row.imageUrl, metadata, 'items', imageCtx)) ?? null;
}

async function ensureCatalogImageFromImport(
  db: PrismaClient,
  catalogId: string,
  row: BulkImportPayloadItem,
  metadata: Record<string, unknown>,
  imageCtx: BulkImportImageContext
): Promise<void> {
  if (!row.imageUrl?.trim()) return;

  const catalog = await db.catalog_items.findUnique({
    where: { id: catalogId },
    select: { imageUrl: true },
  });
  if (!catalog) return;
  if (catalog.imageUrl && isOurStorageUrl(catalog.imageUrl)) return;

  const stored = await resolveRowImageForImport(row, metadata, imageCtx);
  if (stored && isOurStorageUrl(stored)) {
    await updateCatalogItem(db, catalogId, { imageUrl: stored });
  }
}

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

function catalogMetadataRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

/** فقط کلیدهای با مقدار واقعی — رشته/آرایهٔ خالی و null متادیتای DB را پاک نمی‌کنند */
export function pickNonEmptyMetadataUpdates(
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}

/**
 * حالت «به‌روزرسانی با JSON»: فقط مقادیر غیرخالیِ آمده در payload عوض می‌شوند.
 * کلید غایب یا رشتهٔ خالی («») دادهٔ کاتالوگ را پاک نمی‌کند؛ metadata هم merge می‌شود.
 */
export function buildCatalogJsonOverwritePatch(
  existing: {
    title: string;
    description: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
    metadata: unknown;
  },
  row: BulkImportPayloadItem,
  opts: {
    categorySlug: string;
    incomingMeta: Record<string, unknown>;
    resolvedImageUrl?: string | null;
  }
): {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  externalUrl?: string | null;
  categorySlug: string;
  metadata: Prisma.InputJsonValue;
  externalKey: string | null;
} {
  const title = row.title?.trim() || existing.title;
  const existingMeta = catalogMetadataRecord(existing.metadata);
  const tipFromRow =
    typeof row.tip === 'string' && row.tip.trim() ? row.tip.trim() : undefined;
  const incomingMeta = pickNonEmptyMetadataUpdates(
    mergeItemTipIntoMetadata(opts.incomingMeta, tipFromRow)
  );
  const metadata =
    Object.keys(incomingMeta).length > 0
      ? ({ ...existingMeta, ...incomingMeta } as Prisma.InputJsonValue)
      : ((existing.metadata as Prisma.InputJsonValue) ?? {});

  const description =
    typeof row.description === 'string' ? row.description.trim() : '';
  const externalUrl =
    typeof row.externalUrl === 'string' ? row.externalUrl.trim() : '';
  const imageFromRow =
    typeof row.imageUrl === 'string' ? row.imageUrl.trim() : '';
  const resolvedImage = opts.resolvedImageUrl?.trim() || '';

  return {
    title,
    ...(description ? { description } : {}),
    ...(imageFromRow || resolvedImage
      ? { imageUrl: resolvedImage || imageFromRow || null }
      : {}),
    ...(externalUrl ? { externalUrl } : {}),
    categorySlug: opts.categorySlug,
    metadata,
    externalKey: buildCatalogExternalKey(opts.categorySlug, title, metadata),
  };
}

async function overwriteCatalogFromImportRow(
  db: PrismaClient,
  catalogId: string,
  row: BulkImportPayloadItem,
  metaRecord: Record<string, unknown>,
  categorySlug: string,
  imageCtx: BulkImportImageContext
): Promise<void> {
  const existing = await db.catalog_items.findUnique({
    where: { id: catalogId },
    select: {
      title: true,
      description: true,
      imageUrl: true,
      externalUrl: true,
      metadata: true,
    },
  });
  if (!existing) return;

  let resolvedImageUrl: string | null | undefined;
  if (typeof row.imageUrl === 'string' && row.imageUrl.trim()) {
    resolvedImageUrl = await resolveRowImageForImport(row, metaRecord, imageCtx);
  }

  const patch = buildCatalogJsonOverwritePatch(existing, row, {
    categorySlug,
    incomingMeta: metaRecord,
    resolvedImageUrl,
  });

  await updateCatalogItem(db, catalogId, patch);
}

async function importOneRow(
  db: PrismaClient,
  index: number,
  row: BulkImportPayloadItem,
  assignedOrder: number,
  ctx: {
    categorySlug: string;
    listId: string;
    imageCtx: BulkImportImageContext;
    overwriteExistingData: boolean;
    match: Awaited<ReturnType<typeof resolveBulkImportMatchesBatch>>[number];
    /** قفل مشترک batch برای resolve/create کاتالوگ */
    catalogLocks: Map<string, Promise<string>>;
  }
): Promise<BulkImportRowResult> {
  const titleRaw = row.title?.trim();
  const descRaw = row.description?.trim();
  const title = titleRaw || (descRaw ? descRaw.slice(0, 80).trim() : '');
  if (!title) {
    return { index, title: '—', status: 'error', message: 'عنوان خالی' };
  }

  try {
    const rawMeta = (row.metadata ?? {}) as Record<string, unknown>;
    const metaInput = normalizeBulkImportMetadata(
      ctx.categorySlug,
      rawMeta,
      row.externalUrl
    );
    // entryKind سبک (tip/fact/link) فقط برای دسته‌های mixed؛ catalog_ref از JSON هم حفظ می‌شود
    const lightweightKind = extractBulkImportEntryKind(
      ctx.categorySlug,
      metaInput,
      row.entryKind ?? metaInput.entryKind
    );
    if (lightweightKind) metaInput.entryKind = lightweightKind;
    const topLevelKind = parseEntryKind(row.entryKind);
    if (topLevelKind) metaInput.entryKind = topLevelKind;
    carryCatalogPlacementMetadata(rawMeta, metaInput);

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
    carryCatalogPlacementMetadata(rawMeta, metaRecord);
    carryCatalogPlacementMetadata(metaInput, metaRecord);
    if (topLevelKind) metaRecord.entryKind = topLevelKind;
    if (!parseEntryKind(metaRecord.entryKind)) {
      delete metaRecord.entryKind;
    }
    const entryKind =
      lightweightKind ?? parseEntryKind(metaRecord.entryKind) ?? parseEntryKind(row.entryKind);

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

      const storedImage = await resolveRowImageForImport(row, metaRecord, ctx.imageCtx);
      const imageUrl = storedImage || row.imageUrl?.trim() || null;
      const liveItemId =
        resolveBulkImportLiveItemId(row) ||
        (await findLightweightItemIdByTitle(db, ctx.listId, title));

      if (liveItemId) {
        try {
          const updated = await updateLightweightListItem(db, {
            itemId: liveItemId,
            listId: ctx.listId,
            title,
            description: row.description?.trim() || null,
            imageUrl,
            externalUrl: row.externalUrl?.trim() || null,
            metadata: metaRecord as Prisma.InputJsonValue,
            entryKind,
          });
          return {
            index,
            title,
            status: 'updated',
            itemId: updated.id,
            updated: true,
            lightweight: true,
            message: resolveBulkImportLiveItemId(row)
              ? 'جایگاه سبک با liveItemId به‌روز شد'
              : 'جایگاه سبک هم‌عنوان در این لیست به‌روز شد',
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'خطا در آپدیت جایگاه سبک';
          return { index, title, status: 'error', message: msg };
        }
      }

      const item = await createLightweightListItem(db, {
        title,
        description: row.description?.trim() || null,
        imageUrl,
        externalUrl: row.externalUrl?.trim() || null,
        listId: ctx.listId,
        order: assignedOrder,
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
    const dedupeKey = importCatalogDedupeKey(ctx.categorySlug, row, match);

    const resolveCatalogId = async (): Promise<{ id: string; existedBefore: boolean }> => {
      const directCatalogId = row.catalogItemId?.trim();
      const existingId =
        (directCatalogId &&
          (await db.catalog_items.findUnique({
            where: { id: directCatalogId },
            select: { id: true },
          }))?.id) ||
        match.catalogId ||
        (await resolveBulkImportCatalogId(db, ctx.categorySlug, {
          ...row,
          catalogItemId: directCatalogId,
        }));

      if (existingId) {
        return { id: existingId, existedBefore: true };
      }

      let finalImage: string | null = null;
      if (row.imageUrl?.trim()) {
        finalImage = await resolveRowImageForImport(row, metaRecord, ctx.imageCtx);
      }

      const catalog = await createCatalogItem(db, {
        title,
        description: row.description?.trim() || null,
        imageUrl: finalImage,
        externalUrl: row.externalUrl?.trim() || null,
        categorySlug: ctx.categorySlug,
        metadata: metaRecord as Prisma.InputJsonValue,
      });
      return { id: catalog.id, existedBefore: false };
    };

    let catalogId: string;
    let existingCatalog: boolean;
    const inflight = ctx.catalogLocks.get(dedupeKey);
    if (inflight) {
      catalogId = await inflight;
      existingCatalog = true;
    } else {
      let resolved!: { id: string; existedBefore: boolean };
      const pending = (async () => {
        resolved = await resolveCatalogId();
        return resolved.id;
      })();
      ctx.catalogLocks.set(dedupeKey, pending);
      catalogId = await pending;
      existingCatalog = resolved.existedBefore;
    }

    if (existingCatalog && ctx.overwriteExistingData) {
      await overwriteCatalogFromImportRow(
        db,
        catalogId,
        row,
        metaRecord,
        ctx.categorySlug,
        ctx.imageCtx
      );
    } else if (existingCatalog && row.imageUrl?.trim()) {
      await ensureCatalogImageFromImport(db, catalogId, row, metaRecord, ctx.imageCtx);
    }

    const inTargetList = await isCatalogInList(db, catalogId, ctx.listId);
    if (inTargetList) {
      return {
        index,
        title,
        status: 'updated',
        catalogItemId: catalogId,
        listCount: match.listCount,
        updated: true,
        message: ctx.overwriteExistingData
          ? 'از قبل در این لیست بود — دادهٔ کاتالوگ با JSON به‌روز شد'
          : 'از قبل در این لیست است — دادهٔ اصلی کاتالوگ حفظ شد',
      };
    }

    let item: { id: string };
    try {
      item = await addCatalogItemToList(db, {
        catalogItemId: catalogId,
        listId: ctx.listId,
        order: assignedOrder,
        // یکتایی ترتیب در batch موازی؛ بدون clamp به nextAppend
        orderMode: 'absolute',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      // مسابقهٔ موازی روی همان کاتالوگ در همین لیست
      if (msg.includes('قبلاً در این لیست') || msg.includes('Unique constraint')) {
        return {
          index,
          title,
          status: 'updated',
          catalogItemId: catalogId,
          listCount: match.listCount,
          updated: true,
          message: 'از قبل در این لیست است — از ساخت تکراری جلوگیری شد',
        };
      }
      throw err;
    }

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
        message: ctx.overwriteExistingData
          ? listCount != null
            ? `کاتالوگ با JSON به‌روز شد و به این لیست اضافه شد (${listCount.toLocaleString('fa-IR')} لیست دیگر)`
            : 'کاتالوگ با JSON به‌روز شد و به این لیست اضافه شد'
          : listCount != null
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

export async function executeBulkImportForList(
  listId: string,
  items: BulkImportPayloadItem[],
  options?: { prisma?: PrismaClient; notify?: boolean; overwriteExistingData?: boolean }
): Promise<BulkImportExecuteResult> {
  const db = options?.prisma ?? defaultPrisma;
  const shouldNotify = options?.notify !== false;
  const overwriteExistingData = options?.overwriteExistingData === true;

  if (!listId?.trim()) {
    throw new Error('لیست الزامی است');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('حداقل یک آیتم لازم است');
  }
  if (items.length > 100) {
    throw new Error('حداکثر ۱۰۰ آیتم در هر import');
  }

  const list = await db.lists.findUnique({
    where: { id: listId },
    include: { categories: true },
  });

  if (!list || list.deletedAt) {
    throw new Error('لیست یافت نشد');
  }
  if (!list.categories) {
    throw new Error('دستهٔ لیست یافت نشد');
  }

  const categorySlug = list.categories.slug;
  const maxOrderAgg = await db.items.aggregate({
    where: { listId, deletedAt: null },
    _max: { order: true },
  });
  // ترتیب فیلد order در JSON فقط برای مرتب‌سازی ورودی است؛ جایگاه‌های جدید
  // همیشه اعداد یکتای متراکم می‌گیرند تا concurrency=۵ ترتیب تکراری نسازد.
  const assignedOrders = assignDenseImportOrders(items, maxOrderAgg._max.order ?? -1);
  const imageCtx = await createBulkImportImageContext();
  const matches = await resolveBulkImportMatchesBatch(db, categorySlug, listId, items);
  const catalogLocks = new Map<string, Promise<string>>();

  const rowResults = await mapWithConcurrency(items, IMPORT_CONCURRENCY, (row, index) =>
    importOneRow(db, index, row, assignedOrders[index], {
      categorySlug,
      listId,
      imageCtx,
      overwriteExistingData,
      match: matches[index],
      catalogLocks,
    })
  );

  let created = 0;
  let linked = 0;
  let updated = 0;
  let lightweight = 0;
  let placementsAdded = 0;
  const results: BulkImportRowResult[] = [];

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

  if (shouldNotify && placementsAdded > 0) {
    notifyListBookmarkers(listId, {
      itemCount: placementsAdded,
      categorySlug: list.categories?.slug,
      categoryName: list.categories?.name,
      listTitle: list.title,
    }).catch(console.error);
  }

  if (placementsAdded > 0) {
    // تضمین یکتایی ۰…n-۱ حتی اگر ردیفی وسط راه skip شده باشد
    await renormalizeListItemOrders(db, listId);
  }

  if (placementsAdded > 0 || updated > 0 || created > 0 || linked > 0) {
    revalidateListDetailCache(list.slug);
    revalidateCategoryCache(list.categoryId, list.categories.slug);
    revalidateHomeCache();
  }

  return {
    imported: placementsAdded,
    created,
    linked,
    updated,
    lightweight,
    total: items.length,
    results,
  };
}
