/**
 * پر کردن catalog_items برای آیتم‌های موجود (۱:۱ در ابتدا)
 * npx tsx scripts/backfill-catalog-items.ts
 */

import { prisma } from '../lib/prisma';
import {
  backfillCatalogForItem,
  buildCatalogExternalKey,
  createCatalogItem,
} from '../lib/catalog-items';

async function main() {
  const withoutCatalog = await prisma.items.findMany({
    where: { catalogItemId: null },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`آیتم بدون کاتالوگ: ${withoutCatalog.length}`);

  let created = 0;
  let linked = 0;
  let errors = 0;

  for (const { id } of withoutCatalog) {
    try {
      const item = await prisma.items.findUnique({
        where: { id },
        include: { lists: { include: { categories: true } } },
      });
      if (!item) continue;

      const categorySlug = item.lists?.categories?.slug ?? null;
      const externalKey = buildCatalogExternalKey(
        categorySlug,
        item.title,
        item.metadata
      );

      let catalogId: string;
      if (externalKey) {
        const existing = await prisma.catalog_items.findUnique({
          where: { externalKey },
        });
        if (existing) {
          catalogId = existing.id;
          linked++;
        } else {
          const catalog = await createCatalogItem(prisma, {
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
            externalUrl: item.externalUrl,
            categorySlug,
            metadata: item.metadata ?? {},
            externalKey,
          });
          catalogId = catalog.id;
          created++;
        }
      } else {
        const catalog = await backfillCatalogForItem(prisma, id);
        if (!catalog) continue;
        catalogId = catalog.id;
        created++;
        continue;
      }

      const dup = await prisma.items.findFirst({
        where: { listId: item.listId, catalogItemId: catalogId },
      });
      if (dup && dup.id !== item.id) {
        console.warn(
          `تکرار در لیست ${item.listId}: item ${item.id} vs ${dup.id} — catalog ${catalogId}`
        );
        errors++;
        continue;
      }

      await prisma.items.update({
        where: { id },
        data: { catalogItemId: catalogId },
      });
    } catch (e) {
      errors++;
      console.error(id, e);
    }
  }

  console.log({ created, linked, errors, done: true });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
