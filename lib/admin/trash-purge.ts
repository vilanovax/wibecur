import type { PrismaClient } from '@prisma/client';

/**
 * حذف دائمی موجودیت‌هایی که قبلاً در زباله‌دان هستند.
 * فقط ردیف‌های soft-deleted پاک می‌شوند.
 */
export async function purgeTrashLists(
  prisma: PrismaClient,
  ids: string[]
): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await prisma.lists.findMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
    select: { id: true },
  });
  if (rows.length === 0) return 0;
  const result = await prisma.lists.deleteMany({
    where: { id: { in: rows.map((r) => r.id) }, deletedAt: { not: null } },
  });
  return result.count;
}

export async function purgeTrashCategories(
  prisma: PrismaClient,
  ids: string[]
): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await prisma.categories.findMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
    select: { id: true },
  });
  if (rows.length === 0) return 0;
  const result = await prisma.categories.deleteMany({
    where: { id: { in: rows.map((r) => r.id) }, deletedAt: { not: null } },
  });
  return result.count;
}

export async function purgeTrashItems(
  prisma: PrismaClient,
  ids: string[]
): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await prisma.items.findMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
    select: { id: true },
  });
  if (rows.length === 0) return 0;
  const result = await prisma.items.deleteMany({
    where: { id: { in: rows.map((r) => r.id) }, deletedAt: { not: null } },
  });
  return result.count;
}
