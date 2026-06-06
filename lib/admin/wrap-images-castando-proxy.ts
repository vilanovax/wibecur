import type { PrismaClient } from '@prisma/client';
import {
  needsCastandoProxyWrap,
  wrapWithCastandoImageProxy,
} from '@/lib/castando-image-proxy';
import {
  getItemProxyTargetUrl,
  itemNeedsCastandoProxyWrap,
} from '@/lib/admin/proxy-target-image-url';
import { normalizeAdminImageUrl } from '@/lib/resolve-admin-item-image';
import { syncPlacementsFromCatalog } from '@/lib/catalog-items';

export type WrapCastandoProxyResult = {
  processed: number;
  skipped: number;
  alreadyProxied: number;
  errors: string[];
  message: string;
};

export type WrapCastandoProxyPreview = {
  count: number;
  totalInScope: number;
  samples: {
    id: string;
    title: string;
    imageUrl: string;
    wrappedUrl: string;
  }[];
};

type ListScope = {
  listId?: string;
  categoryId?: string;
};

type CatalogScope = {
  categorySlug?: string;
  listId?: string;
  multiListOnly?: boolean;
};

type ItemRow = {
  id: string;
  title: string;
  imageUrl: string | null;
  metadata: unknown;
  catalogItemId: string | null;
  catalog_items: { id: string; imageUrl: string | null } | null;
};

async function applyProxyToItemRow(
  prisma: PrismaClient,
  row: ItemRow
): Promise<'processed' | 'skipped' | 'alreadyProxied'> {
  const originalUrl = getItemProxyTargetUrl(row);

  if (!originalUrl) return 'skipped';
  if (isCastandoAlready(originalUrl)) return 'alreadyProxied';
  if (!needsCastandoProxyWrap(originalUrl)) return 'skipped';

  const wrapped = wrapWithCastandoImageProxy(originalUrl);
  if (!wrapped) return 'skipped';

  const catalogUrl = row.catalog_items?.imageUrl?.trim() || '';
  const catalogNorm = catalogUrl ? normalizeAdminImageUrl(catalogUrl) : null;

  // همیشه imageUrl آیتم در DB = proxyAddress + originalUrl
  await prisma.items.update({
    where: { id: row.id },
    data: { imageUrl: wrapped, updatedAt: new Date() },
  });

  // اگر منبع نمایش کاتالوگ بود، کاتالوگ هم به‌روز شود
  if (
    row.catalogItemId &&
    catalogNorm &&
    catalogNorm === originalUrl
  ) {
    await prisma.catalog_items.update({
      where: { id: row.catalogItemId },
      data: { imageUrl: wrapped, updatedAt: new Date() },
    });
  }

  return 'processed';
}

function isCastandoAlready(url: string): boolean {
  return url.includes('castando.ir') && url.includes('image-proxy.php?url=');
}

async function fetchListItemRows(
  prisma: PrismaClient,
  scope: ListScope
): Promise<ItemRow[]> {
  const { listId, categoryId } = scope;
  if (!listId && !categoryId) return [];

  return prisma.items.findMany({
    where: listId ? { listId } : { lists: { categoryId: categoryId! } },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      metadata: true,
      catalogItemId: true,
      catalog_items: { select: { id: true, imageUrl: true } },
    },
  });
}

/** پیش‌نمایش — آیتم‌هایی که URL نمایشی‌شان هنوز پراکسی نیست */
export async function previewListItemsCastandoProxy(
  prisma: PrismaClient,
  scope: ListScope
): Promise<WrapCastandoProxyPreview> {
  const rows = await fetchListItemRows(prisma, scope);
  const needing = rows.filter((row) => itemNeedsCastandoProxyWrap(row));

  return {
    count: needing.length,
    totalInScope: rows.length,
    samples: needing.slice(0, 5).map((row) => {
      const imageUrl = getItemProxyTargetUrl(row);
      return {
        id: row.id,
        title: row.title,
        imageUrl,
        wrappedUrl: wrapWithCastandoImageProxy(imageUrl) || imageUrl,
      };
    }),
  };
}

/** آیتم‌های یک لیست یا دسته — به‌روزرسانی imageUrl در DB */
export async function wrapListItemsWithCastandoProxy(
  prisma: PrismaClient,
  scope: ListScope
): Promise<WrapCastandoProxyResult> {
  const { listId, categoryId } = scope;
  if (!listId && !categoryId) {
    return {
      processed: 0,
      skipped: 0,
      alreadyProxied: 0,
      errors: ['listId یا categoryId الزامی است'],
      message: '',
    };
  }

  const rows = await fetchListItemRows(prisma, scope);
  let processed = 0;
  let skipped = 0;
  let alreadyProxied = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const status = await applyProxyToItemRow(prisma, row);
      if (status === 'processed') processed += 1;
      else if (status === 'alreadyProxied') alreadyProxied += 1;
      else skipped += 1;
    } catch (e: unknown) {
      errors.push(`${row.title}: ${e instanceof Error ? e.message : 'خطا'}`);
      skipped += 1;
    }
  }

  const message = buildMessage(processed, skipped, alreadyProxied, errors.length);
  return { processed, skipped, alreadyProxied, errors: errors.slice(0, 8), message };
}

/** پیش‌نمایش کاتالوگ */
export async function previewCatalogItemsCastandoProxy(
  prisma: PrismaClient,
  scope: CatalogScope
): Promise<WrapCastandoProxyPreview> {
  const rows = await fetchCatalogRowsForScope(prisma, scope);
  const needing = rows.filter((r) => needsCastandoProxyWrap(r.imageUrl));

  return {
    count: needing.length,
    totalInScope: rows.length,
    samples: needing.slice(0, 5).map((row) => {
      const imageUrl = row.imageUrl?.trim() || '';
      return {
        id: row.id,
        title: row.title,
        imageUrl,
        wrappedUrl: wrapWithCastandoImageProxy(imageUrl) || imageUrl,
      };
    }),
  };
}

async function fetchCatalogRowsForScope(
  prisma: PrismaClient,
  scope: CatalogScope
): Promise<{ id: string; title: string; imageUrl: string | null }[]> {
  const { listCatalogExternalImageItems } = await import('@/lib/catalog-items');

  const scopedExternal = await listCatalogExternalImageItems(prisma, scope);
  const scopedIds = new Set(scopedExternal.map((c) => c.id));

  return prisma.catalog_items.findMany({
    where: {
      ...(scope.categorySlug ? { categorySlug: scope.categorySlug } : {}),
      ...(scope.listId ? { items: { some: { listId: scope.listId } } } : {}),
      ...(scope.multiListOnly && scopedIds.size > 0 ? { id: { in: [...scopedIds] } } : {}),
    },
    select: { id: true, title: true, imageUrl: true },
  });
}

/** موجودیت‌های کاتالوگ */
export async function wrapCatalogItemsWithCastandoProxy(
  prisma: PrismaClient,
  scope: CatalogScope
): Promise<WrapCastandoProxyResult> {
  const rows = await fetchCatalogRowsForScope(prisma, scope);

  if (scope.multiListOnly && rows.length === 0) {
    return {
      processed: 0,
      skipped: 0,
      alreadyProxied: 0,
      errors: [],
      message: buildMessage(0, 0, 0, 0),
    };
  }

  let processed = 0;
  let skipped = 0;
  let alreadyProxied = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const imageUrl = row.imageUrl?.trim() || '';
    if (!imageUrl) {
      skipped += 1;
      continue;
    }
    if (isCastandoAlready(imageUrl)) {
      alreadyProxied += 1;
      continue;
    }
    if (!needsCastandoProxyWrap(imageUrl)) {
      skipped += 1;
      continue;
    }

    const wrapped = wrapWithCastandoImageProxy(imageUrl);
    if (!wrapped) {
      skipped += 1;
      continue;
    }

    try {
      await prisma.catalog_items.update({
        where: { id: row.id },
        data: { imageUrl: wrapped, updatedAt: new Date() },
      });
      await syncPlacementsFromCatalog(prisma, row.id);
      processed += 1;
    } catch (e: unknown) {
      errors.push(`${row.title}: ${e instanceof Error ? e.message : 'خطا'}`);
      skipped += 1;
    }
  }

  const message = buildMessage(processed, skipped, alreadyProxied, errors.length);
  return { processed, skipped, alreadyProxied, errors: errors.slice(0, 8), message };
}

function buildMessage(
  processed: number,
  skipped: number,
  alreadyProxied: number,
  errorCount: number
): string {
  const parts = [`${processed.toLocaleString('fa-IR')} تصویر در DB به‌روز شد`];
  if (alreadyProxied > 0) {
    parts.push(`${alreadyProxied.toLocaleString('fa-IR')} از قبل پراکسی بود`);
  }
  if (skipped > 0) parts.push(`${skipped.toLocaleString('fa-IR')} بدون تغییر`);
  if (errorCount > 0) parts.push(`${errorCount.toLocaleString('fa-IR')} خطا`);
  return parts.join(' · ');
}
