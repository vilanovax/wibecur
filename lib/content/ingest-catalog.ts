import type { PrismaClient } from '@prisma/client';
import {
  findCatalogByExternalKey,
  searchCatalogItems,
} from '@/lib/catalog-items';
import { extractCatalogImdbId } from '@/lib/missing-image-utils';
import { getBulkImportCategoryKind } from '@/lib/admin/bulk-import';

export type IngestCatalogHit = {
  catalogItemId: string;
  title: string;
  /** نوع برای بات: movie | book | podcast | app | cafe | mixed */
  type: string;
  categorySlug: string | null;
  imdbId: string | null;
  mediaType: string | null;
  imageUrl: string | null;
  listCount: number;
};

export type IngestCatalogSearchResult =
  | { ok: true; items: IngestCatalogHit[]; query: { q: string | null; imdbId: string | null; mediaType: string | null } }
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

function resolveType(
  categorySlug: string | null | undefined,
  metadata: Record<string, unknown>
): string {
  const media =
    typeof metadata.mediaType === 'string' ? metadata.mediaType.trim().toLowerCase() : '';
  if (media === 'book' || media === 'podcast' || media === 'app') return media;

  const kind = getBulkImportCategoryKind(categorySlug);
  if (kind === 'movie') return 'movie';
  if (kind === 'book') return 'book';
  if (kind === 'cafe') return 'cafe';
  return 'mixed';
}

function matchesMediaTypeFilter(type: string, mediaType: string | null): boolean {
  if (!mediaType) return true;
  const want = mediaType.trim().toLowerCase();
  if (!want) return true;
  if (want === 'movie' || want === 'film' || want === 'series' || want === 'cinema') {
    return type === 'movie';
  }
  if (want === 'book' || want === 'podcast' || want === 'app') {
    return type === want;
  }
  if (want === 'cafe' || want === 'restaurant' || want === 'food') {
    return type === 'cafe';
  }
  return type === want || type.includes(want);
}

function categorySlugForMediaType(mediaType: string | null): string | undefined {
  if (!mediaType) return undefined;
  const want = mediaType.trim().toLowerCase();
  if (want === 'movie' || want === 'film' || want === 'series' || want === 'cinema') {
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

function toHit(row: {
  id: string;
  title: string;
  imageUrl: string | null;
  categorySlug: string | null;
  metadata: unknown;
  externalUrl?: string | null;
  externalKey?: string | null;
  listCount: number;
}): IngestCatalogHit {
  const metadata = asMeta(row.metadata);
  const mediaType =
    typeof metadata.mediaType === 'string' && metadata.mediaType.trim()
      ? metadata.mediaType.trim().toLowerCase()
      : null;
  return {
    catalogItemId: row.id,
    title: row.title,
    type: resolveType(row.categorySlug, metadata),
    categorySlug: row.categorySlug,
    imdbId: extractCatalogImdbId({
      metadata: row.metadata,
      externalUrl: row.externalUrl ?? null,
      externalKey: row.externalKey ?? null,
    }),
    mediaType,
    imageUrl: row.imageUrl,
    listCount: row.listCount,
  };
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
  const mediaType = opts.mediaType?.trim() || null;
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

  const hits: IngestCatalogHit[] = [];
  const seen = new Set<string>();

  if (imdbId) {
    const byKey = await findCatalogByExternalKey(db, `imdb:${imdbId}`);
    if (byKey) {
      const count = await db.items.count({
        where: { catalogItemId: byKey.id, deletedAt: null },
      });
      const hit = toHit({
        id: byKey.id,
        title: byKey.title,
        imageUrl: byKey.imageUrl,
        categorySlug: byKey.categorySlug,
        metadata: byKey.metadata,
        externalUrl: byKey.externalUrl,
        externalKey: byKey.externalKey,
        listCount: count,
      });
      if (matchesMediaTypeFilter(hit.type, mediaType)) {
        hits.push(hit);
        seen.add(hit.catalogItemId);
      }
    }
  }

  if (q) {
    const categorySlug = categorySlugForMediaType(mediaType);
    const rows = await searchCatalogItems(db, q, {
      limit: Math.max(limit * 2, limit),
      categorySlug,
    });
    const missingIds = rows.map((r) => r.id).filter((id) => !seen.has(id));
    const listCountById = new Map(rows.map((r) => [r.id, r.listCount]));
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
        const hit = toHit({
          ...full,
          listCount: listCountById.get(id) ?? 0,
        });
        if (!matchesMediaTypeFilter(hit.type, mediaType)) continue;
        hits.push(hit);
        seen.add(hit.catalogItemId);
        if (hits.length >= limit) break;
      }
    }
  }

  return {
    ok: true,
    items: hits.slice(0, limit),
    query: { q, imdbId, mediaType },
  };
}
