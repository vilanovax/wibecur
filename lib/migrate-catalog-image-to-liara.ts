import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uploadImageFromUrlDetailed } from '@/lib/object-storage';
import {
  isAppObjectStorageImageUrl,
  isExternalDirectImageUrl,
} from '@/lib/item-image-storage';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import { syncPlacementsFromCatalog } from '@/lib/catalog-items';

export type MigrateCatalogImageStatus = 'migrated' | 'already_on_storage' | 'no_image' | 'failed';

export type MigrateCatalogImageResult = {
  catalogId: string;
  status: MigrateCatalogImageStatus;
  previousUrl?: string | null;
  newUrl?: string | null;
  error?: string;
  errorCode?: 'storage_not_configured' | 'download_failed' | 'upload_failed';
};

export async function migrateCatalogExternalImageToLiara(
  catalogId: string,
  client: PrismaClient = prisma
): Promise<MigrateCatalogImageResult> {
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
    select: { id: true, title: true, imageUrl: true },
  });

  if (!catalog) {
    return { catalogId, status: 'failed', error: 'موجودیت کاتالوگ یافت نشد' };
  }

  const imageUrl = catalog.imageUrl?.trim() || '';

  if (!imageUrl) {
    return { catalogId, status: 'no_image', error: 'تصویری برای این موجودیت یافت نشد' };
  }

  if (!isExternalDirectImageUrl(imageUrl)) {
    return {
      catalogId,
      status: 'already_on_storage',
      previousUrl: imageUrl,
      newUrl: imageUrl,
    };
  }

  const upload = await uploadImageFromUrlDetailed(imageUrl, 'items');

  if (!upload.ok) {
    return {
      catalogId,
      status: 'failed',
      previousUrl: imageUrl,
      error: upload.error,
      errorCode: upload.code,
    };
  }

  const uploadedUrl = upload.url;

  if (!isAppObjectStorageImageUrl(uploadedUrl)) {
    return {
      catalogId,
      status: 'failed',
      previousUrl: imageUrl,
      error: 'URL آپلودشده به ParsPack تشخیص داده نشد',
      errorCode: 'upload_failed',
    };
  }

  await client.catalog_items.update({
    where: { id: catalogId },
    data: { imageUrl: uploadedUrl, updatedAt: new Date() },
  });
  await syncPlacementsFromCatalog(client, catalogId);

  return {
    catalogId,
    status: 'migrated',
    previousUrl: imageUrl,
    newUrl: uploadedUrl,
  };
}
