import 'server-only';

import type { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  buildCafePhotoSearchQuery,
  extractCafeCoverMetadata,
  isCafeCategorySlug,
} from '@/lib/cafe-cover-search';
import { searchGoogleImages } from '@/lib/admin/google-image-search';
import { importExternalImageToStorage } from '@/lib/admin/import-external-image-to-storage';
import { getItemEffectiveImageUrl, hasParsPackInUrl } from '@/lib/item-image-storage';
import { isPlaceholderCoverPath } from '@/lib/image-url-policy';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import { syncPlacementsFromCatalog } from '@/lib/catalog-items';
import { parseItemMetadata } from '@/lib/resolve-admin-item-image';
import { isValidHttpImageUrl } from '@/lib/image-url-sanitize';

export type FetchItemCafePhotoResult = {
  itemId: string;
  status:
    | 'fetched'
    | 'already_on_storage'
    | 'failed';
  searchQuery?: string;
  previousUrl?: string | null;
  newUrl?: string | null;
  error?: string;
  errorCode?: 'storage_not_configured' | 'download_failed' | 'upload_failed' | 'invalid_url';
};

export type SearchItemCafePhotosResult = {
  itemId: string;
  query: string;
  results: Array<{
    title: string;
    link: string;
    thumbnail: string;
    width: number;
    height: number;
    contextLink?: string;
  }>;
  error?: string;
};

function mergeCafePhotoMetadata(
  existing: unknown,
  patch: { imageUrl: string; source: 'google_cse' }
): Record<string, unknown> {
  const base =
    existing != null && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const meta = parseItemMetadata(base) || {};
  return {
    ...base,
    ...meta,
    photoSource: patch.source,
    photoFetchedAt: new Date().toISOString(),
    coverImageUrl: patch.imageUrl,
  };
}

async function loadCafeItem(itemId: string, client: PrismaClient) {
  return client.items.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      metadata: true,
      catalogItemId: true,
      catalog_items: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          metadata: true,
          categorySlug: true,
        },
      },
      lists: {
        select: {
          title: true,
          categories: { select: { slug: true } },
        },
      },
    },
  });
}

export async function searchItemCafePhotos(
  itemId: string,
  client: PrismaClient = prisma,
  overrideQuery?: string
): Promise<SearchItemCafePhotosResult> {
  const item = await loadCafeItem(itemId, client);
  if (!item) {
    return { itemId, query: '', results: [], error: 'آیتم یافت نشد' };
  }

  const categorySlug =
    item.lists.categories?.slug || item.catalog_items?.categorySlug || null;
  if (!isCafeCategorySlug(categorySlug)) {
    return { itemId, query: '', results: [], error: 'این آیتم در دسته کافه/رستوران نیست' };
  }

  const metadata = extractCafeCoverMetadata(item.metadata ?? item.catalog_items?.metadata);
  const query =
    overrideQuery?.trim() ||
    buildCafePhotoSearchQuery(item.title, metadata, item.lists.title);

  const { results, error } = await searchGoogleImages(query);
  return { itemId, query, results, error };
}

export async function fetchItemCafePhoto(
  itemId: string,
  imageUrl: string,
  client: PrismaClient = prisma
): Promise<FetchItemCafePhotoResult> {
  const trimmedUrl = imageUrl.trim();
  if (!isValidHttpImageUrl(trimmedUrl)) {
    return {
      itemId,
      status: 'failed',
      errorCode: 'invalid_url',
      error: 'آدرس تصویر نامعتبر است',
    };
  }

  const readiness = await checkObjectStorageReady();
  if (!readiness.ready) {
    return {
      itemId,
      status: 'failed',
      errorCode: 'storage_not_configured',
      error: readiness.error || 'ParsPack Object Storage پیکربندی نشده است',
    };
  }

  const item = await loadCafeItem(itemId, client);
  if (!item) {
    return { itemId, status: 'failed', error: 'آیتم یافت نشد' };
  }

  const categorySlug =
    item.lists.categories?.slug || item.catalog_items?.categorySlug || null;
  if (!isCafeCategorySlug(categorySlug)) {
    return { itemId, status: 'failed', error: 'این آیتم در دسته کافه/رستوران نیست' };
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

  const metadata = extractCafeCoverMetadata(item.metadata ?? item.catalog_items?.metadata);
  const searchQuery = buildCafePhotoSearchQuery(item.title, metadata, item.lists.title);

  const upload = await importExternalImageToStorage(trimmedUrl, 'items');
  if (!upload.ok) {
    return {
      itemId,
      status: 'failed',
      searchQuery,
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
      searchQuery,
      error: 'آپلود تصویر به ParsPack ناموفق بود',
      errorCode: 'upload_failed',
    };
  }

  const metadataPatch = mergeCafePhotoMetadata(item.metadata, {
    imageUrl: stored,
    source: 'google_cse',
  });

  if (item.catalogItemId && item.catalog_items) {
    const catalogMeta = mergeCafePhotoMetadata(item.catalog_items.metadata, {
      imageUrl: stored,
      source: 'google_cse',
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
    searchQuery,
    previousUrl: effectiveUrl || null,
    newUrl: stored,
  };
}
