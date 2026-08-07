import 'server-only';

import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { searchGoogleImages } from '@/lib/admin/google-image-search';
import {
  buildCatalogRepairSearchQuery,
  type StorageImageRepairRow,
} from '@/lib/admin/storage-image-repair';
import { importExternalImageToStorage } from '@/lib/admin/import-external-image-to-storage';
import { hasParsPackInUrl, needsS3MigrationImageUrl } from '@/lib/item-image-storage';
import { isPlaceholderCoverPath } from '@/lib/image-url-policy';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import { syncPlacementsFromCatalog } from '@/lib/catalog-items';
import { catalogMissingPosterImage } from '@/lib/missing-image-utils';
import { isValidHttpImageUrl } from '@/lib/image-url-sanitize';
import { migrateCatalogExternalImageToLiara } from '@/lib/migrate-catalog-image-to-liara';

export type SearchCatalogRepairPhotosResult = {
  catalogId: string;
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

export type ApplyCatalogRepairPhotoResult = {
  catalogId: string;
  status: 'applied' | 'already_on_storage' | 'failed';
  previousUrl?: string | null;
  newUrl?: string | null;
  searchQuery?: string;
  error?: string;
  errorCode?: 'storage_not_configured' | 'download_failed' | 'upload_failed' | 'invalid_url';
};

async function loadCatalogRow(catalogId: string, client: PrismaClient) {
  return client.catalog_items.findUnique({
    where: { id: catalogId },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      categorySlug: true,
      metadata: true,
    },
  });
}

export async function searchCatalogRepairPhotos(
  catalogId: string,
  client: PrismaClient = prisma,
  overrideQuery?: string
): Promise<SearchCatalogRepairPhotosResult> {
  const row = await loadCatalogRow(catalogId, client);
  if (!row) {
    return { catalogId, query: '', results: [], error: 'موجودیت کاتالوگ یافت نشد' };
  }

  const query =
    overrideQuery?.trim() ||
    buildCatalogRepairSearchQuery({
      title: row.title,
      categorySlug: row.categorySlug,
      metadata: row.metadata,
    });

  const { results, error } = await searchGoogleImages(query);
  return { catalogId, query, results, error };
}

export async function applyCatalogRepairPhoto(
  catalogId: string,
  imageUrl: string,
  client: PrismaClient = prisma,
  options?: { useCastandoProxy?: boolean }
): Promise<ApplyCatalogRepairPhotoResult> {
  const trimmedUrl = imageUrl.trim();
  if (!isValidHttpImageUrl(trimmedUrl)) {
    return {
      catalogId,
      status: 'failed',
      errorCode: 'invalid_url',
      error: 'آدرس تصویر نامعتبر است',
    };
  }

  const readiness = await checkObjectStorageReady();
  if (!readiness.ready) {
    return {
      catalogId,
      status: 'failed',
      errorCode: 'storage_not_configured',
      error: readiness.error || 'ParsPack Object Storage پیکربندی نشده است',
    };
  }

  const row = await loadCatalogRow(catalogId, client);
  if (!row) {
    return { catalogId, status: 'failed', error: 'موجودیت کاتالوگ یافت نشد' };
  }

  const previousUrl = row.imageUrl?.trim() || '';
  if (previousUrl && !isPlaceholderCoverPath(previousUrl) && hasParsPackInUrl(previousUrl)) {
    return {
      catalogId,
      status: 'already_on_storage',
      previousUrl,
      newUrl: previousUrl,
    };
  }

  const searchQuery = buildCatalogRepairSearchQuery({
    title: row.title,
    categorySlug: row.categorySlug,
    metadata: row.metadata,
  });

  const metadataBase =
    row.metadata != null && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? { ...(row.metadata as Record<string, unknown>) }
      : {};

  const upload = await importExternalImageToStorage(trimmedUrl, 'items', metadataBase, undefined, undefined, {
    preferCastandoProxy: options?.useCastandoProxy,
  });
  if (!upload.ok) {
    return {
      catalogId,
      status: 'failed',
      searchQuery,
      previousUrl: previousUrl || null,
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
      catalogId,
      status: 'failed',
      searchQuery,
      previousUrl: previousUrl || null,
      error: 'آپلود تصویر به ParsPack ناموفق بود',
      errorCode: 'upload_failed',
    };
  }

  await client.catalog_items.update({
    where: { id: catalogId },
    data: {
      imageUrl: stored,
      metadata: {
        ...metadataBase,
        photoSource: 'google_cse',
        photoFetchedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    },
  });

  await syncPlacementsFromCatalog(client, catalogId);

  return {
    catalogId,
    status: 'applied',
    searchQuery,
    previousUrl: previousUrl || null,
    newUrl: stored,
  };
}

export async function migrateCatalogRepairExternal(
  catalogId: string,
  client: PrismaClient = prisma,
  options?: { useCastandoProxy?: boolean }
) {
  return migrateCatalogExternalImageToLiara(catalogId, client, options);
}

export function summarizeRepairRow(row: StorageImageRepairRow) {
  return {
    id: row.id,
    title: row.title,
    categorySlug: row.categorySlug,
    categoryLabel: row.categoryLabel,
    imageUrl: row.imageUrl,
    status: row.status,
    host: row.host,
    listCount: row.listCount,
    imdbId: row.imdbId,
    isHidden: row.isHidden,
  };
}

export function catalogNeedsRepair(imageUrl: string | null | undefined): boolean {
  const url = imageUrl?.trim() || '';
  if (catalogMissingPosterImage(url)) return true;
  return needsS3MigrationImageUrl(url);
}