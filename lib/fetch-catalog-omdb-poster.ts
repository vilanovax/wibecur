import 'server-only';

import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  createBulkImportImageContext,
  resolveOmdbPoster,
} from '@/lib/admin/bulk-import-image';
import { ensureImageInLiara } from '@/lib/object-storage';
import { isAppObjectStorageImageUrl } from '@/lib/item-image-storage';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import { syncPlacementsFromCatalog } from '@/lib/catalog-items';
import {
  catalogMissingPosterImage,
  extractCatalogImdbId,
  extractItemImdbId,
} from '@/lib/missing-image-utils';

export type FetchCatalogOmdbPosterResult = {
  catalogId: string;
  status:
    | 'fetched'
    | 'already_has_image'
    | 'no_imdb'
    | 'no_poster'
    | 'no_omdb_key'
    | 'failed';
  previousUrl?: string | null;
  newUrl?: string | null;
  imdbId?: string;
  error?: string;
  errorCode?: 'storage_not_configured' | 'download_failed' | 'upload_failed';
};

export async function fetchCatalogOmdbPoster(
  catalogId: string,
  client: PrismaClient = prisma
): Promise<FetchCatalogOmdbPosterResult> {
  const readiness = await checkObjectStorageReady();
  if (!readiness.ready) {
    return {
      catalogId,
      status: 'failed',
      errorCode: 'storage_not_configured',
      error: readiness.error || 'ParsPack Object Storage پیکربندی نشده است',
    };
  }

  const catalog = await client.catalog_items.findUnique({
    where: { id: catalogId },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      metadata: true,
      externalUrl: true,
      externalKey: true,
    },
  });

  if (!catalog) {
    return { catalogId, status: 'failed', error: 'موجودیت کاتالوگ یافت نشد' };
  }

  if (!catalogMissingPosterImage(catalog.imageUrl)) {
    return {
      catalogId,
      status: 'already_has_image',
      previousUrl: catalog.imageUrl,
      newUrl: catalog.imageUrl,
    };
  }

  const imdbId = extractCatalogImdbId(catalog);
  if (!imdbId) {
    return { catalogId, status: 'no_imdb', error: 'شناسه IMDb یافت نشد' };
  }

  const ctx = await createBulkImportImageContext();
  if (!ctx.omdbApiKey) {
    return {
      catalogId,
      status: 'no_omdb_key',
      error: 'کلید API OMDb در تنظیمات تنظیم نشده است',
    };
  }

  const posterUrl = await resolveOmdbPoster(imdbId, ctx);
  if (!posterUrl) {
    return {
      catalogId,
      status: 'no_poster',
      imdbId,
      error: 'پوستر در OMDb یافت نشد',
    };
  }

  const stored = await ensureImageInLiara(posterUrl, 'items');
  if (!stored || !isAppObjectStorageImageUrl(stored)) {
    return {
      catalogId,
      status: 'failed',
      imdbId,
      error: 'آپلود تصویر به ParsPack ناموفق بود',
      errorCode: 'upload_failed',
    };
  }

  await client.catalog_items.update({
    where: { id: catalogId },
    data: { imageUrl: stored, updatedAt: new Date() },
  });
  await syncPlacementsFromCatalog(client, catalogId);

  return {
    catalogId,
    status: 'fetched',
    imdbId,
    previousUrl: catalog.imageUrl,
    newUrl: stored,
  };
}

export async function fetchItemOmdbPoster(
  itemId: string,
  client: PrismaClient = prisma
): Promise<FetchCatalogOmdbPosterResult & { itemId: string }> {
  const item = await client.items.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      imageUrl: true,
      metadata: true,
      externalUrl: true,
      catalogItemId: true,
      catalog_items: {
        select: {
          id: true,
          imageUrl: true,
          metadata: true,
          externalUrl: true,
          externalKey: true,
        },
      },
    },
  });

  if (!item) {
    return { itemId, catalogId: itemId, status: 'failed', error: 'آیتم یافت نشد' };
  }

  if (item.catalogItemId && item.catalog_items) {
    const result = await fetchCatalogOmdbPoster(item.catalogItemId, client);
    return { ...result, itemId };
  }

  const readiness = await checkObjectStorageReady();
  if (!readiness.ready) {
    return {
      itemId,
      catalogId: itemId,
      status: 'failed',
      errorCode: 'storage_not_configured',
      error: readiness.error || 'ParsPack Object Storage پیکربندی نشده است',
    };
  }

  if (!catalogMissingPosterImage(item.imageUrl)) {
    return {
      itemId,
      catalogId: itemId,
      status: 'already_has_image',
      previousUrl: item.imageUrl,
      newUrl: item.imageUrl,
    };
  }

  const imdbId = extractItemImdbId({
    metadata: item.metadata,
    externalUrl: item.externalUrl,
  });
  if (!imdbId) {
    return { itemId, catalogId: itemId, status: 'no_imdb', error: 'شناسه IMDb یافت نشد' };
  }

  const ctx = await createBulkImportImageContext();
  if (!ctx.omdbApiKey) {
    return {
      itemId,
      catalogId: itemId,
      status: 'no_omdb_key',
      error: 'کلید API OMDb در تنظیمات تنظیم نشده است',
    };
  }

  const posterUrl = await resolveOmdbPoster(imdbId, ctx);
  if (!posterUrl) {
    return {
      itemId,
      catalogId: itemId,
      status: 'no_poster',
      imdbId,
      error: 'پوستر در OMDb یافت نشد',
    };
  }

  const stored = await ensureImageInLiara(posterUrl, 'items');
  if (!stored || !isAppObjectStorageImageUrl(stored)) {
    return {
      itemId,
      catalogId: itemId,
      status: 'failed',
      imdbId,
      error: 'آپلود تصویر به ParsPack ناموفق بود',
      errorCode: 'upload_failed',
    };
  }

  await client.items.update({
    where: { id: itemId },
    data: { imageUrl: stored, updatedAt: new Date() },
  });

  return {
    itemId,
    catalogId: itemId,
    status: 'fetched',
    imdbId,
    previousUrl: item.imageUrl,
    newUrl: stored,
  };
}
