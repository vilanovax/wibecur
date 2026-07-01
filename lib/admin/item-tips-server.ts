import type { Prisma, PrismaClient } from '@prisma/client';
import { syncPlacementsFromCatalog } from '@/lib/catalog-items';
import { validateMetadata } from '@/lib/schemas/item-metadata';

function asMetaRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

export async function updateItemTip(
  prisma: PrismaClient,
  itemId: string,
  tip: string | null
): Promise<void> {
  const item = await prisma.items.findUnique({
    where: { id: itemId },
    include: {
      lists: { include: { categories: true } },
      catalog_items: { select: { id: true, metadata: true } },
    },
  });

  if (!item) throw new Error('آیتم یافت نشد');

  const categorySlug = item.lists.categories?.slug;
  if (!categorySlug) throw new Error('دسته‌بندی آیتم یافت نشد');

  const itemMeta = asMetaRecord(item.metadata);
  const catalogMeta = asMetaRecord(item.catalog_items?.metadata);
  const baseMeta = item.catalogItemId ? { ...catalogMeta, ...itemMeta } : itemMeta;
  const nextMeta = { ...baseMeta };

  const trimmed = tip?.trim() || '';
  if (trimmed) nextMeta.tip = trimmed;
  else delete nextMeta.tip;

  const validation = validateMetadata(categorySlug, nextMeta);
  if (!validation.success) {
    throw new Error(validation.error);
  }

  const metaRecord = (validation.data ?? {}) as Record<string, unknown>;

  if (item.catalogItemId) {
    await prisma.catalog_items.update({
      where: { id: item.catalogItemId },
      data: {
        metadata: metaRecord as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
    await syncPlacementsFromCatalog(prisma, item.catalogItemId);
    return;
  }

  await prisma.items.update({
    where: { id: itemId },
    data: {
      metadata: metaRecord as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  });
}
