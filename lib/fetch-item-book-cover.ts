import 'server-only';

import type { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { searchBookCovers } from '@/lib/book-cover-search';
import { pickBestTitleMatch } from '@/lib/books/title-match';
import { detectBookUrl } from '@/lib/books/url-detect';
import type { BookSource } from '@/lib/books/types';
import { fetchFidiboBookDetail } from '@/lib/books/fidibo';
import { fetchKetabrahBookDetail } from '@/lib/books/ketabrah';
import { fetchTaaghcheBookDetail } from '@/lib/books/taaghche';
import { formatBookFetchError } from '@/lib/books/fetch-errors';
import { importExternalImageToStorage } from '@/lib/admin/import-external-image-to-storage';
import { getItemEffectiveImageUrl, hasParsPackInUrl } from '@/lib/item-image-storage';
import { isPlaceholderCoverPath } from '@/lib/image-url-policy';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import { syncPlacementsFromCatalog } from '@/lib/catalog-items';
import { parseItemMetadata } from '@/lib/resolve-admin-item-image';

export type FetchItemBookCoverResult = {
  itemId: string;
  status:
    | 'fetched'
    | 'already_on_storage'
    | 'no_match'
    | 'no_cover'
    | 'failed';
  source?: BookSource;
  sourceId?: string;
  bookUrl?: string;
  previousUrl?: string | null;
  newUrl?: string | null;
  matchedTitle?: string;
  error?: string;
  errorCode?: 'storage_not_configured' | 'download_failed' | 'upload_failed';
};

const MIN_TITLE_SCORE = 65;

async function fetchCoverFromBookId(
  source: BookSource,
  bookId: string,
  maxRetries = 2
): Promise<{ coverUrl: string | null; bookUrl: string; title: string } | null> {
  if (source === 'fidibo') {
    const detail = await fetchFidiboBookDetail(bookId, { maxRetries });
    if (!detail?.coverUrl) return null;
    return { coverUrl: detail.coverUrl, bookUrl: detail.bookUrl, title: detail.title };
  }
  if (source === 'ketabrah') {
    const detail = await fetchKetabrahBookDetail(bookId, { maxRetries });
    if (!detail?.coverUrl) return null;
    return { coverUrl: detail.coverUrl, bookUrl: detail.bookUrl, title: detail.title };
  }
  const detail = await fetchTaaghcheBookDetail(bookId, { maxRetries });
  if (!detail?.coverUrl) return null;
  return { coverUrl: detail.coverUrl, bookUrl: detail.bookUrl, title: detail.title };
}

async function resolveBookCoverUrl(input: {
  title: string;
  source: BookSource;
  externalUrl?: string | null;
}): Promise<{ coverUrl: string; bookUrl: string; sourceId: string; matchedTitle: string } | null> {
  const externalUrl = input.externalUrl?.trim() || '';
  if (externalUrl) {
    const detected = detectBookUrl(externalUrl);
    if (detected?.mode === 'book' && detected.source === input.source) {
      const fromId = await fetchCoverFromBookId(input.source, detected.bookId);
      if (fromId?.coverUrl) {
        return {
          coverUrl: fromId.coverUrl,
          bookUrl: fromId.bookUrl,
          sourceId: detected.bookId,
          matchedTitle: fromId.title,
        };
      }
    }
  }

  const results = await searchBookCovers(input.title, input.source, { limit: 8, maxRetries: 2 });
  const best = pickBestTitleMatch(input.title, results, MIN_TITLE_SCORE);
  if (!best?.coverUrl) return null;

  const idMatch = best.id.match(/^(?:fidibo|ketabrah|taaghche)-(.+)$/i);
  return {
    coverUrl: best.coverUrl,
    bookUrl: best.bookUrl,
    sourceId: idMatch?.[1] || best.id,
    matchedTitle: best.title,
  };
}

function mergeBookMetadata(
  existing: unknown,
  patch: { source: BookSource; sourceId: string; bookUrl?: string }
): Record<string, unknown> {
  const base =
    existing != null && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const meta = parseItemMetadata(base);
  return {
    ...base,
    source: patch.source,
    sourceId: patch.sourceId,
    ...(patch.bookUrl ? { bookUrl: patch.bookUrl } : {}),
    ...(meta?.author ? { author: meta.author } : {}),
  };
}

export async function fetchItemBookCover(
  itemId: string,
  source: BookSource,
  client: PrismaClient = prisma
): Promise<FetchItemBookCoverResult> {
  const readiness = await checkObjectStorageReady();
  if (!readiness.ready) {
    return {
      itemId,
      status: 'failed',
      errorCode: 'storage_not_configured',
      error: readiness.error || 'ParsPack Object Storage پیکربندی نشده است',
    };
  }

  const item = await client.items.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      externalUrl: true,
      metadata: true,
      catalogItemId: true,
      catalog_items: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          externalUrl: true,
          metadata: true,
        },
      },
    },
  });

  if (!item) {
    return { itemId, status: 'failed', error: 'آیتم یافت نشد' };
  }

  const effectiveUrl = getItemEffectiveImageUrl({
    imageUrl: item.imageUrl,
    catalogImageUrl: item.catalog_items?.imageUrl,
  });

  if (effectiveUrl && !isPlaceholderCoverPath(effectiveUrl) && hasParsPackInUrl(effectiveUrl)) {
    return {
      itemId,
      status: 'already_on_storage',
      previousUrl: effectiveUrl,
      newUrl: effectiveUrl,
    };
  }

  const searchTitle = item.title.trim();
  if (!searchTitle) {
    return { itemId, status: 'failed', error: 'عنوان آیتم خالی است' };
  }

  const externalUrl = item.externalUrl?.trim() || item.catalog_items?.externalUrl?.trim() || null;

  try {
    const resolved = await resolveBookCoverUrl({
      title: searchTitle,
      source,
      externalUrl,
    });

    if (!resolved) {
      return {
        itemId,
        status: 'no_match',
        source,
        error: `کتابی با عنوان «${searchTitle}» در ${source} یافت نشد`,
      };
    }

    const upload = await importExternalImageToStorage(resolved.coverUrl, 'items');
    if (!upload.ok) {
      return {
        itemId,
        status: 'failed',
        source,
        sourceId: resolved.sourceId,
        error: upload.error || 'آپلود تصویر به ParsPack ناموفق بود',
        errorCode:
          upload.code === 'storage_not_configured'
            ? 'storage_not_configured'
            : upload.code === 'download_failed'
              ? 'download_failed'
              : 'upload_failed',
      };
    }

    const stored = upload.url;
    if (!hasParsPackInUrl(stored)) {
      return {
        itemId,
        status: 'failed',
        source,
        sourceId: resolved.sourceId,
        error: 'آپلود تصویر به ParsPack ناموفق بود',
        errorCode: 'upload_failed',
      };
    }

    const metadataPatch = mergeBookMetadata(item.metadata, {
      source,
      sourceId: resolved.sourceId,
      bookUrl: resolved.bookUrl,
    });

    if (item.catalogItemId && item.catalog_items) {
      const catalogMeta = mergeBookMetadata(item.catalog_items.metadata, {
        source,
        sourceId: resolved.sourceId,
        bookUrl: resolved.bookUrl,
      });

      await client.catalog_items.update({
        where: { id: item.catalogItemId },
        data: {
          imageUrl: stored,
          metadata: catalogMeta as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
      await syncPlacementsFromCatalog(client, item.catalogItemId);
    }

    await client.items.update({
      where: { id: itemId },
      data: {
        imageUrl: stored,
        metadata: metadataPatch as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    return {
      itemId,
      status: 'fetched',
      source,
      sourceId: resolved.sourceId,
      bookUrl: resolved.bookUrl,
      matchedTitle: resolved.matchedTitle,
      previousUrl: effectiveUrl || null,
      newUrl: stored,
    };
  } catch (err: unknown) {
    return {
      itemId,
      status: 'failed',
      source,
      error: formatBookFetchError(err),
    };
  }
}
