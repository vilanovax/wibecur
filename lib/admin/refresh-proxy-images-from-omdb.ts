import type { PrismaClient } from '@prisma/client';
import { isCastandoImageProxyUrl } from '@/lib/castando-image-proxy';
import {
  createBulkImportImageContext,
  resolveOmdbPoster,
} from '@/lib/admin/bulk-import-image';
import { ensureImageInLiara } from '@/lib/object-storage';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { getItemProxyTargetUrl } from '@/lib/admin/proxy-target-image-url';
import { parseItemMetadata, normalizeAdminImageUrl } from '@/lib/resolve-admin-item-image';

import { isMovieCategorySlug } from '@/lib/movie-category';

export type OmdbRefreshResult = {
  processed: number;
  skipped: number;
  failed: number;
  noImdb: number;
  errors: string[];
  message: string;
};

export type OmdbRefreshPreview = {
  count: number;
  totalProxy: number;
  noImdb: number;
  totalInScope: number;
  samples: { id: string; title: string; imdbId: string; currentUrl: string }[];
};

type ListScope = {
  listId?: string;
  categoryId?: string;
};

type ItemRow = {
  id: string;
  title: string;
  imageUrl: string | null;
  externalUrl: string | null;
  metadata: unknown;
  catalogItemId: string | null;
  catalog_items: { id: string; imageUrl: string | null } | null;
};

export function extractImdbId(
  metadata: unknown,
  externalUrl?: string | null
): string | null {
  const meta = parseItemMetadata(metadata as Record<string, unknown> | null);
  const fromMeta =
    (typeof meta?.imdbId === 'string' && meta.imdbId.trim()) ||
    (typeof meta?.imdbID === 'string' && meta.imdbID.trim()) ||
    null;
  if (fromMeta) return fromMeta.replace(/^imdb-/i, '');

  const url = externalUrl?.trim() || '';
  const m = url.match(/imdb\.com\/title\/(tt\d+)/i);
  return m?.[1] ?? null;
}

/** آیتم دارای URL پراکسی castando در imageUrl / catalog / نمایش */
export function itemHasProxyImage(row: ItemRow): boolean {
  const candidates = [
    row.imageUrl,
    row.catalog_items?.imageUrl,
    getItemProxyTargetUrl(row),
  ];
  return candidates.some((u) => isCastandoImageProxyUrl(u));
}

async function fetchListRows(
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
      externalUrl: true,
      metadata: true,
      catalogItemId: true,
      catalog_items: { select: { id: true, imageUrl: true } },
    },
  });
}

export async function assertMovieScope(
  prisma: PrismaClient,
  scope: ListScope
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { listId, categoryId } = scope;
  if (listId) {
    const list = await prisma.lists.findUnique({
      where: { id: listId },
      include: { categories: { select: { slug: true } } },
    });
    if (!list) return { ok: false, error: 'لیست یافت نشد' };
    if (!isMovieCategorySlug(list.categories?.slug)) {
      return { ok: false, error: 'این عملیات فقط برای دسته فیلم است' };
    }
    return { ok: true };
  }
  if (categoryId) {
    const cat = await prisma.categories.findUnique({
      where: { id: categoryId },
      select: { slug: true },
    });
    if (!cat) return { ok: false, error: 'دسته یافت نشد' };
    if (!isMovieCategorySlug(cat.slug)) {
      return { ok: false, error: 'این عملیات فقط برای دسته فیلم است' };
    }
    return { ok: true };
  }
  return { ok: false, error: 'listId یا categoryId الزامی است' };
}

export async function previewProxyItemsOmdbRefresh(
  prisma: PrismaClient,
  scope: ListScope
): Promise<OmdbRefreshPreview> {
  const rows = await fetchListRows(prisma, scope);
  const proxyRows = rows.filter((row) => itemHasProxyImage(row));
  const withImdb = proxyRows.filter((row) =>
    Boolean(extractImdbId(row.metadata, row.externalUrl))
  );
  const noImdb = proxyRows.length - withImdb.length;

  return {
    count: withImdb.length,
    totalProxy: proxyRows.length,
    noImdb,
    totalInScope: rows.length,
    samples: withImdb.slice(0, 5).map((row) => ({
      id: row.id,
      title: row.title,
      imdbId: extractImdbId(row.metadata, row.externalUrl)!,
      currentUrl: getItemProxyTargetUrl(row),
    })),
  };
}

async function applyOmdbRefreshToItem(
  prisma: PrismaClient,
  row: ItemRow,
  ctx: Awaited<ReturnType<typeof createBulkImportImageContext>>
): Promise<'processed' | 'skipped' | 'no_imdb' | 'failed'> {
  if (!itemHasProxyImage(row)) return 'skipped';

  const imdbId = extractImdbId(row.metadata, row.externalUrl);
  if (!imdbId) return 'no_imdb';

  const poster = await resolveOmdbPoster(imdbId, ctx);
  if (!poster) return 'failed';

  let stored = poster;
  if (!isOurStorageUrl(poster)) {
    const uploaded = await ensureImageInLiara(poster, 'items');
    if (!uploaded) return 'failed';
    stored = uploaded;
  }

  const catalogUrl = row.catalog_items?.imageUrl?.trim() || '';
  const catalogNorm = catalogUrl ? normalizeAdminImageUrl(catalogUrl) : null;
  const displayUrl = getItemProxyTargetUrl(row);

  await prisma.items.update({
    where: { id: row.id },
    data: { imageUrl: stored, updatedAt: new Date() },
  });

  if (
    row.catalogItemId &&
    catalogNorm &&
    (isCastandoImageProxyUrl(catalogUrl) || catalogNorm === displayUrl)
  ) {
    await prisma.catalog_items.update({
      where: { id: row.catalogItemId },
      data: { imageUrl: stored, updatedAt: new Date() },
    });
  }

  return 'processed';
}

export async function refreshProxyItemsFromOmdb(
  prisma: PrismaClient,
  scope: ListScope
): Promise<OmdbRefreshResult> {
  const gate = await assertMovieScope(prisma, scope);
  if (!gate.ok) {
    return {
      processed: 0,
      skipped: 0,
      failed: 0,
      noImdb: 0,
      errors: [gate.error],
      message: '',
    };
  }

  if (!scope.listId && !scope.categoryId) {
    return {
      processed: 0,
      skipped: 0,
      failed: 0,
      noImdb: 0,
      errors: ['listId یا categoryId الزامی است'],
      message: '',
    };
  }

  const ctx = await createBulkImportImageContext();
  if (!ctx.omdbApiKey) {
    return {
      processed: 0,
      skipped: 0,
      failed: 0,
      noImdb: 0,
      errors: ['کلید API OMDb در تنظیمات پیکربندی نشده'],
      message: '',
    };
  }

  const rows = await fetchListRows(prisma, scope);
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let noImdb = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const status = await applyOmdbRefreshToItem(prisma, row, ctx);
      if (status === 'processed') processed += 1;
      else if (status === 'no_imdb') noImdb += 1;
      else if (status === 'failed') {
        failed += 1;
        errors.push(`${row.title}: پوستر OMDb یافت نشد / آپلود ناموفق`);
      } else skipped += 1;
    } catch (e: unknown) {
      failed += 1;
      errors.push(`${row.title}: ${e instanceof Error ? e.message : 'خطا'}`);
    }
  }

  const message = buildMessage(processed, failed, noImdb, skipped, errors.length);
  return { processed, skipped, failed, noImdb, errors: errors.slice(0, 8), message };
}

function buildMessage(
  processed: number,
  failed: number,
  noImdb: number,
  skipped: number,
  errorCount: number
): string {
  const parts: string[] = [];
  if (processed > 0) {
    parts.push(`${processed.toLocaleString('fa-IR')} تصویر از OMDb → ParsPack`);
  }
  if (noImdb > 0) {
    parts.push(`${noImdb.toLocaleString('fa-IR')} پراکسی بدون imdbId`);
  }
  if (failed > 0 || errorCount > 0) {
    parts.push(`${Math.max(failed, errorCount).toLocaleString('fa-IR')} خطا`);
  }
  if (skipped > 0) parts.push(`${skipped.toLocaleString('fa-IR')} رد شد`);
  return parts.length > 0 ? parts.join(' · ') : 'موردی برای به‌روزرسانی نبود';
}
