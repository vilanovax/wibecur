/**
 * یکتا و متراکم‌سازی order جایگاه‌های لیست‌هایی که ترتیب تکراری دارند.
 *
 * Usage: npx tsx scripts/repair-duplicate-item-orders.ts
 */
import { PrismaClient } from '@prisma/client';
import { renormalizeListItemOrders } from '../lib/admin/reorder-list-items';

const prisma = new PrismaClient();

async function main() {
  const dups = await prisma.$queryRaw<Array<{ listId: string; order: number; c: number }>>`
    SELECT "listId", "order", COUNT(*)::int AS c
    FROM items
    WHERE "deletedAt" IS NULL
    GROUP BY "listId", "order"
    HAVING COUNT(*) > 1
  `;

  const affected = [...new Set(dups.map((d) => d.listId))];
  console.log(`لیست‌های دارای ترتیب تکراری: ${affected.length}`);

  for (const listId of affected) {
    const list = await prisma.lists.findUnique({
      where: { id: listId },
      select: { title: true, deletedAt: true },
    });
    if (!list) {
      console.log(`⊘ ${listId} — لیست وجود ندارد (orphan items)، رد شد`);
      continue;
    }
    if (list.deletedAt) {
      console.log(`⊘ ${list.title} — در زباله‌دان، رد شد`);
      continue;
    }
    const result = await renormalizeListItemOrders(prisma, listId);
    const after = await prisma.items.findMany({
      where: { listId, deletedAt: null },
      select: { order: true },
      orderBy: { order: 'asc' },
    });
    const orders = after.map((a) => a.order);
    const unique = new Set(orders).size;
    console.log(
      `✓ ${list?.title ?? listId} → ${result.itemCount} آیتم، یکتا=${unique === orders.length ? 'بله' : 'خیر'}، max=${orders.at(-1) ?? '-'}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
