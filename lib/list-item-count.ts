import type { Prisma, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

/** آیتم‌های حذف‌نشدهٔ یک لیست. */
export async function countLiveListItems(db: Db, listId: string): Promise<number> {
  return db.items.count({ where: { listId, deletedAt: null } });
}

/**
 * اگر پنجرهٔ اول پر نشده، همان تعداد بارگذاری‌شده حقیقت است.
 * شمارندهٔ ذخیره‌شده می‌تواند از آیتم‌های واقعی جلو باشد.
 */
export function displayedItemCount(loaded: number, pageLimit: number, liveTotal: number): number {
  if (loaded < pageLimit) return loaded;
  return liveTotal;
}

/** شمارندهٔ ذخیره‌شده را با آیتم‌های زنده یکی می‌کند. */
export async function recountListItemCount(db: Db, listId: string): Promise<number> {
  const count = await countLiveListItems(db, listId);
  await db.lists.update({
    where: { id: listId },
    data: { itemCount: count },
  });
  return count;
}

/** هر لیستی که itemCount با آیتم‌های زنده نمی‌خواند را اصلاح می‌کند. */
export async function syncStoredListItemCounts(db: Db): Promise<number> {
  return db.$executeRaw`
    UPDATE lists AS l
    SET "itemCount" = sub.live
    FROM (
      SELECT l2.id,
             (
               SELECT COUNT(*)::int
               FROM items i
               WHERE i."listId" = l2.id AND i."deletedAt" IS NULL
             ) AS live
      FROM lists l2
    ) AS sub
    WHERE l.id = sub.id
      AND l."itemCount" IS DISTINCT FROM sub.live
  `;
}
