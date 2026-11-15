import type { PrismaClient } from '@prisma/client';
import {
  findCatalogByExternalKey,
  searchCatalogItems,
} from '@/lib/catalog-items';
import { extractCatalogImdbId } from '@/lib/missing-image-utils';
import { getBulkImportCategoryKind } from '@/lib/admin/bulk-import';

/** مقدارهای مجاز query param mediaType برای بات */
export const INGEST_CATALOG_MEDIA_TYPE_FILTERS = [
  'movie',
  'film',
  'cinema',
  'series',
  'tv',
  'show',
  'book',
  'podcast',
  'app',
  'cafe',
  'restaurant',
  'food',
] as const;

export type IngestCatalogMediaTypeFilter =
  (typeof INGEST_CATALOG_MEDIA_TYPE_FILTERS)[number];

export type IngestCatalogHit = {
  catalogItemId: string;
  title: string;
  /** نوع برای بات: movie | series | book | podcast | app | cafe | mixed */
  type: string;
  categorySlug: string | null;
  imdbId: string | null;
  /** همیشه پر می‌شود وقتی type شناخته‌شده باشد (نه فقط از metadata خام) */
  mediaType: string | null;
  imageUrl: string | null;
  /** تعداد جایگاه زنده در لیست‌ها (deletedAt=null) */
  listCount: number;
};

export type IngestCatalogSearchResult =
  | {
      ok: true;
      items: IngestCatalogHit[];
      query: { q: string | null; imdbId: string | null; mediaType: string | null };
      mediaTypeFilters: readonly string[];
    }
  | { ok: false; status: number; code: string; error: string };

function asMeta(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeImdbId(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const m = t.match(/tt\d{5,}/i);
  if (m) return m[0].toLowerCase().replace(/^tt/i, 'tt');
  if (/^\d{5,}$/.test(t)) return `tt${t}`;
  return null;
}

function readMetaString(meta: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = meta[key];
    if (typeof v === 'string' && v.trim()) return v.trim().toLowerCase();
  }
  return null;
}

function hasSeriesSignal(meta: Record<string, unknown>): boolean {
  if (meta.episodes != null && String(meta.episodes).trim() !== '') return true;
  if (meta.totalSeasons != null && String(meta.totalSeasons).trim() !== '') return true;
  if (meta.seasons != null && String(meta.seasons).trim() !== '') return true;
  if (typeof meta.creator === 'string' && meta.creator.trim()) return true;
  return false;
}

/**
 * تشخیص نوع موجودیت برای بات.
 * فیلم و سریال هر دو در دسته movies می‌نشینند؛ با metadata / سیگنال سریال جدا می‌شوند.
 */
export function resolveIngestCatalogType(
  categorySlug: string | null | undefined,
  metadata: Record<string, unknown>
): string {
  const explicit = readMetaString(metadata, ['mediaType', 'type', 'kind']) ?? '';
  if (
    explicit === 'book' ||
    explicit === 'podcast' ||
    explicit === 'app' ||
    explicit === 'cafe' ||
    explicit === 'movie' ||
    explicit === 'series'
  ) {
    return explicit;
  }
  if (explicit === 'tv' || explicit === 'show' || explicit === 'tvseries') {
    return 'series';
  }
  if (explicit === 'film' || explicit === 'cinema') {
    return 'movie';
  }

  const kind = getBulkImportCategoryKind(categorySlug);
  if (kind === 'movie') {
    return hasSeriesSignal(metadata) ? 'series' : 'movie';
  }
  if (kind === 'book') {
    return 'book';
  }
  if (kind === 'cafe') {
    return 'cafe';
  }
  return 'mixed';
}

function normalizeFilter(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isAllowedCatalogMediaTypeFilter(raw: string): boolean {
  return (INGEST_CATALOG_MEDIA_TYPE_FILTERS as readonly string[]).includes(
    normalizeFilter(raw)
  );
}

function matchesMediaTypeFilter(type: string, mediaType: string | null): boolean {
  if (!mediaType) return true;
  const want = normalizeFilter(mediaType);
  if (!want) return true;
  if (want === 'movie' || want === 'film' || want === 'cinema') {
    return type === 'movie';
  }
  if (want === 'series' || want === 'tv' || want === 'show') {
    return type === 'series';
  }
  if (want === 'book' || want === 'podcast' || want === 'app') {
    return type === want;
  }
  if (want === 'cafe' || want === 'restaurant' || want === 'food') {
    return type === 'cafe';
  }
  return type === want;
}

function categorySlugForMediaType(mediaType: string | null): string | undefined {
  if (!mediaType) return undefined;
  const want = normalizeFilter(mediaType);
  if (
    want === 'movie' ||
    want === 'film' ||
    want === 'cinema' ||
    want === 'series' ||
    want === 'tv' ||
    want === 'show'
  ) {
    return 'movies';
  }
  if (want === 'book' || want === 'podcast' || want === 'app') {
    return 'bookspodcast';
  }
  if (want === 'cafe' || want === 'restaurant' || want === 'food') {
    return 'cafe';
  }
  return undefined;
}

function toHit(
  row: {
    id: string;
    title: string;
    imageUrl: string | null;
    categorySlug: string | null;
    metadata: unknown;
    externalUrl?: string | null;
    externalKey?: string | null;
  },
  listCount: number
): IngestCatalogHit {
  const metadata = asMeta(row.metadata);
  const type = resolveIngestCatalogType(row.categorySlug, metadata);
  return {
    catalogItemId: row.id,
    title: row.title,
    type,
    categorySlug: row.categorySlug,
    imdbId: extractCatalogImdbId({
      metadata: row.metadata,
      externalUrl: row.externalUrl ?? null,
      externalKey: row.externalKey ?? null,
    }),
    mediaType: type === 'mixed' ? null : type,
    imageUrl: row.imageUrl,
    listCount,
  };
}

/** شمارش جایگاه‌های زنده برای چند کاتالوگ — یکسان برای q و imdbId */
async function liveListCountsByCatalogId(
  db: PrismaClient,
  catalogIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (catalogIds.length === 0) return map;
  for (const id of catalogIds) map.set(id, 0);

  const grouped = await db.items.groupBy({
    by: ['catalogItemId'],
    where: {
      catalogItemId: { in: catalogIds },
      deletedAt: null,
    },
    _count: { _all: true },
  });

  for (const row of grouped) {
    if (row.catalogItemId) {
      map.set(row.catalogItemId, row._count._all);
    }
  }
  return map;
}

/**
 * جست‌وجوی کاتالوگ برای بات — جلوگیری از ساخت تکراری.
 * حداقل یکی از q (حداقل ۲ کاراکتر) یا imdbId لازم است.
 */
export async function searchIngestCatalog(
  db: PrismaClient,
  opts: { q?: string | null; imdbId?: string | null; mediaType?: string | null; limit?: number }
): Promise<IngestCatalogSearchResult> {
  const q = opts.q?.trim() || null;
  const imdbRaw = opts.imdbId?.trim() || null;
  const mediaTypeRaw = opts.mediaType?.trim() || null;
  const mediaType = mediaTypeRaw ? normalizeFilter(mediaTypeRaw) : null;
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);

  const imdbId = imdbRaw ? normalizeImdbId(imdbRaw) : null;
  if (imdbRaw && !imdbId) {
    return {
      ok: false,
      status: 400,
      code: 'bad_request',
      error: 'imdbId نامعتبر است؛ نمونه: tt15239678',
    };
  }

  if (mediaType && !isAllowedCatalogMediaTypeFilter(mediaType)) {
    return {
      ok: false,
      status: 400,
      code: 'bad_request',
      error: `mediaType نامعتبر است. مقادیر مجاز: ${INGEST_CATALOG_MEDIA_TYPE_FILTERS.join('، ')}`,
    };
  }

  if (!q && !imdbId) {
    return {
      ok: false,
      status: 400,
      code: 'bad_request',
      error: 'حداقل یکی از q یا imdbId لازم است',
    };
  }
  if (q && q.length < 2) {
    return {
      ok: false,
      status: 400,
      code: 'bad_request',
      error: 'q باید حداقل ۲ کاراکتر باشد',
    };
  }

  const candidateRows: Array<{
    id: string;
    title: string;
    imageUrl: string | null;
    categorySlug: string | null;
    metadata: unknown;
    externalUrl: string | null;
    externalKey: string | null;
  }> = [];
  const seen = new Set<string>();

  if (imdbId) {
    const byKey = await findCatalogByExternalKey(db, `imdb:${imdbId}`);
    if (byKey) {
      candidateRows.push({
        id: byKey.id,
        title: byKey.title,
        imageUrl: byKey.imageUrl,
        categorySlug: byKey.categorySlug,
        metadata: byKey.metadata,
        externalUrl: byKey.externalUrl,
        externalKey: byKey.externalKey,
      });
      seen.add(byKey.id);
    }
  }

  if (q) {
    const categorySlug = categorySlugForMediaType(mediaType);
    const rows = await searchCatalogItems(db, q, {
      limit: Math.max(limit * 2, limit),
      categorySlug,
    });
    const missingIds = rows.map((r) => r.id).filter((id) => !seen.has(id));
    if (missingIds.length > 0) {
      const fullRows = await db.catalog_items.findMany({
        where: { id: { in: missingIds } },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          categorySlug: true,
          metadata: true,
          externalUrl: true,
          externalKey: true,
        },
      });
      const byId = new Map(fullRows.map((r) => [r.id, r]));
      for (const id of missingIds) {
        const full = byId.get(id);
        if (!full) continue;
        candidateRows.push(full);
        seen.add(full.id);
      }
    }
  }

  const counts = await liveListCountsByCatalogId(
    db,
    candidateRows.map((r) => r.id)
  );

  const hits: IngestCatalogHit[] = [];
  for (const row of candidateRows) {
    const hit = toHit(row, counts.get(row.id) ?? 0);
    if (!matchesMediaTypeFilter(hit.type, mediaType)) continue;
    hits.push(hit);
    if (hits.length >= limit) break;
  }

  return {
    ok: true,
    items: hits,
    query: { q, imdbId, mediaType },
    mediaTypeFilters: INGEST_CATALOG_MEDIA_TYPE_FILTERS,
  };
}
