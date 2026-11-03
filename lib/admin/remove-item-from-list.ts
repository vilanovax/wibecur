import type { PrismaClient } from '@prisma/client';
import { recountListItemCount } from '@/lib/list-item-count';
import {
  revalidateCategoryCache,
  revalidateItemDetailCache,
  revalidateListDetailCache,
} from '@/lib/public-cache';

export type RemoveFromListResult = {
  removedId: string;
  listId: string;
  catalogItemId: string | null;
  itemCount: number;
};

/**
 * جایگاه آیتم را از یک لیست برای همیشه جدا می‌کند.
 * کاتالوگ و جایگاه‌های دیگر لیست‌ها دست نخورده می‌مانند؛ به زباله‌دان نمی‌رود.
 */
export async function removeItemFromList(
  prisma: PrismaClient,
  listId: string,
  itemId: string
): Promise<RemoveFromListResult> {
  const list = await prisma.lists.findUnique({
    where: { id: listId },
    select: { id: true, slug: true, categoryId: true, deletedAt: true },
  });
  if (!list || list.deletedAt) {
    throw new RemoveFromListError('لیست یافت نشد', 404);
  }

  const placement = await prisma.items.findFirst({
    where: { id: itemId, listId },
    select: { id: true, catalogItemId: true, deletedAt: true },
  });
  if (!placement) {
    throw new RemoveFromListError('این آیتم در این لیست نیست', 404);
  }

  await prisma.items.delete({ where: { id: placement.id } });

  const live = await prisma.items.findMany({
    where: { listId, deletedAt: null },
    select: { id: true },
    orderBy: { order: 'asc' },
  });

  if (live.length > 0) {
    await prisma.$transaction(
      live.map((row, index) =>
        prisma.items.update({
          where: { id: row.id },
          data: { order: index, updatedAt: new Date() },
        })
      )
    );
  }

  const itemCount = await recountListItemCount(prisma, listId);

  revalidateItemDetailCache(placement.id);
  revalidateListDetailCache(list.slug);
  revalidateCategoryCache(list.categoryId);

  return {
    removedId: placement.id,
    listId,
    catalogItemId: placement.catalogItemId,
    itemCount,
  };
}

export class RemoveFromListError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'RemoveFromListError';
    this.status = status;
  }
}
