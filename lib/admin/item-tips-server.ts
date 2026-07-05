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

/** تبدیل placement id یا catalog id به کلید پایدار «انجام شد» */
export async function resolveItemTipReviewKeys(
  prisma: PrismaClient,
  ids: string[]
): Promise<string[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const [placements, catalogs] = await Promise.all([
    prisma.items.findMany({
      where: { id: { in: unique }, deletedAt: null },
      select: { id: true, catalogItemId: true },
    }),
    prisma.catalog_items.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    }),
  ]);

  const placementKeys = new Map(
    placements.map((row) => [row.id, row.catalogItemId ?? row.id])
  );
  const catalogIds = new Set(catalogs.map((row) => row.id));

  const keys = new Set<string>();
  for (const id of unique) {
    if (placementKeys.has(id)) keys.add(placementKeys.get(id)!);
    else if (catalogIds.has(id)) keys.add(id);
    else keys.add(id);
  }

  return [...keys];
}
