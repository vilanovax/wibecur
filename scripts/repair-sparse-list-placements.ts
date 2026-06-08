/**
 * تعمیر آیتم‌های لیست که فقط عنوان دارند ولی کاتالوگ غنی‌تر در لیست دیگر وجود دارد.
 *
 * Usage: npx tsx scripts/repair-sparse-list-placements.ts [listSlug]
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { relinkSparseItemToMatchingCatalog } from '../lib/catalog-items';

const prisma = new PrismaClient();

async function main() {
  const listSlug = process.argv[2];

  const sparseItems = await prisma.items.findMany({
    where: {
      OR: [{ imageUrl: null }, { description: null }],
      ...(listSlug
        ? { lists: { slug: listSlug, deletedAt: null } }
        : { lists: { deletedAt: null } }),
    },
    select: { id: true, title: true, listId: true, lists: { select: { slug: true, title: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });

  console.log(`Found ${sparseItems.length} sparse item(s) to check`);

  let repaired = 0;
  for (const item of sparseItems) {
    const matched = await relinkSparseItemToMatchingCatalog(prisma, item.id);
    if (matched && (matched.imageUrl || matched.description)) {
      repaired++;
      console.log(`✓ ${item.lists.title} / ${item.title}`);
    }
  }

  console.log(`Repaired ${repaired} item(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
