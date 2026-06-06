import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uploadImageFromUrlDetailed } from '@/lib/object-storage';
import {
  getItemEffectiveImageUrl,
  isExternalDirectImageUrl,
  isAppObjectStorageImageUrl,
} from '@/lib/item-image-storage';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import { backfillCatalogForItem, syncPlacementsFromCatalog } from '@/lib/catalog-items';

export type MigrateItemImageStatus = 'migrated' | 'already_on_storage' | 'no_image' | 'failed';

export type MigrateItemImageResult = {
  itemId: string;
  status: MigrateItemImageStatus;
  previousUrl?: string | null;
  newUrl?: string | null;
  error?: string;
  errorCode?: 'storage_not_configured' | 'download_failed' | 'upload_failed';
};

export async function migrateItemExternalImageToLiara(
  itemId: string,
  client: PrismaClient = prisma
): Promise<MigrateItemImageResult> {
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
      catalogItemId: true,
      imageUrl: true,
      catalog_items: { select: { id: true, imageUrl: true } },
    },
  });

  if (!item) {
    return { itemId, status: 'failed', error: 'آیتم یافت نشد' };
  }

  const effectiveUrl = getItemEffectiveImageUrl({
    imageUrl: item.imageUrl,
    catalogImageUrl: item.catalog_items?.imageUrl,
  });

  if (!effectiveUrl) {
    return { itemId, status: 'no_image', error: 'تصویری برای این آیتم یافت نشد' };
  }

  if (!isExternalDirectImageUrl(effectiveUrl)) {
    return {
      itemId,
      status: 'already_on_storage',
      previousUrl: effectiveUrl,
      newUrl: effectiveUrl,
    };
  }

  const upload = await uploadImageFromUrlDetailed(effectiveUrl, 'items');

  if (!upload.ok) {
    return {
      itemId,
      status: 'failed',
      previousUrl: effectiveUrl,
      error: upload.error,
      errorCode: upload.code,
    };
  }

  const uploadedUrl = upload.url;

  if (!isAppObjectStorageImageUrl(uploadedUrl)) {
    return {
      itemId,
      status: 'failed',
      previousUrl: effectiveUrl,
      error: 'URL آپلودشده به ParsPack تشخیص داده نشد',
      errorCode: 'upload_failed',
    };
  }

  let catalogItemId = item.catalogItemId;
  if (!catalogItemId) {
    const catalog = await backfillCatalogForItem(client, itemId);
    catalogItemId = catalog?.id ?? null;
  }

  if (catalogItemId) {
    await client.catalog_items.update({
      where: { id: catalogItemId },
      data: { imageUrl: uploadedUrl, updatedAt: new Date() },
    });
    await syncPlacementsFromCatalog(client, catalogItemId);
  } else {
    await client.items.update({
      where: { id: itemId },
      data: { imageUrl: uploadedUrl, updatedAt: new Date() },
    });
  }

  return {
    itemId,
    status: 'migrated',
    previousUrl: effectiveUrl,
    newUrl: uploadedUrl,
  };
}
