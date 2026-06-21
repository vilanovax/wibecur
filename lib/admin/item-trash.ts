import type { Prisma, PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function softDeleteItems(
  prisma: DbClient,
  itemIds: string[],
  deletedById?: string | null,
  deleteReason?: string | null
): Promise<number> {
  if (itemIds.length === 0) return 0;

  const items = await prisma.items.findMany({
    where: { id: { in: itemIds }, deletedAt: null },
    select: { id: true, listId: true },
  });
  if (items.length === 0) return 0;

  const now = new Date();
  await prisma.items.updateMany({
    where: { id: { in: items.map((i) => i.id) } },
    data: {
      deletedAt: now,
      deletedById: deletedById ?? null,
      deleteReason: deleteReason ?? null,
      updatedAt: now,
    },
  });

  const listCounts = new Map<string, number>();
  for (const item of items) {
    listCounts.set(item.listId, (listCounts.get(item.listId) ?? 0) + 1);
  }
  for (const [listId, count] of listCounts) {
    await prisma.lists.update({
      where: { id: listId },
      data: { itemCount: { decrement: count } },
    });
  }

  return items.length;
}

export async function restoreItems(prisma: DbClient, itemIds: string[]): Promise<number> {
  if (itemIds.length === 0) return 0;

  const items = await prisma.items.findMany({
    where: { id: { in: itemIds }, deletedAt: { not: null } },
    select: { id: true, listId: true },
  });
  if (items.length === 0) return 0;

  const now = new Date();
  await prisma.items.updateMany({
    where: { id: { in: items.map((i) => i.id) } },
    data: {
      deletedAt: null,
      deletedById: null,
      deleteReason: null,
      updatedAt: now,
    },
  });

  const listCounts = new Map<string, number>();
  for (const item of items) {
    listCounts.set(item.listId, (listCounts.get(item.listId) ?? 0) + 1);
  }
  for (const [listId, count] of listCounts) {
    await prisma.lists.update({
      where: { id: listId },
      data: { itemCount: { increment: count } },
    });
  }

  return items.length;
}
