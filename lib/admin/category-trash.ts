import type { PrismaClient } from '@prisma/client';
import { softDeleteItems } from '@/lib/admin/item-trash';

export type CategoryTrashResult = {
  listsTrashed: number;
  itemsTrashed: number;
};

/**
 * انتقال دسته به زباله‌دان همراه با لیست‌ها و آیتم‌هایش.
 * ترتیب: آیتم‌های فعال → لیست‌های فعال → دسته
 */
export async function trashCategoryWithContents(
  prisma: PrismaClient,
  categoryId: string,
  deletedById: string,
  deleteReason?: string | null
): Promise<CategoryTrashResult> {
  const category = await prisma.categories.findUnique({
    where: { id: categoryId },
    select: { id: true, deletedAt: true, name: true },
  });

  if (!category) {
    throw new Error('دسته‌بندی یافت نشد');
  }
  if (category.deletedAt) {
    throw new Error('این دسته قبلاً به زباله‌دان منتقل شده');
  }

  const listsInCategory = await prisma.lists.findMany({
    where: { categoryId },
    select: { id: true, deletedAt: true },
  });

  const listIds = listsInCategory.map((l) => l.id);
  const activeListIds = listsInCategory.filter((l) => !l.deletedAt).map((l) => l.id);
  const now = new Date();
  const reason = deleteReason ?? null;

  let itemsTrashed = 0;
  let listsTrashed = 0;

  await prisma.$transaction(async (tx) => {
    if (listIds.length > 0) {
      const activeItems = await tx.items.findMany({
        where: { listId: { in: listIds }, deletedAt: null },
        select: { id: true },
      });

      if (activeItems.length > 0) {
        itemsTrashed = await softDeleteItems(
          tx,
          activeItems.map((i) => i.id),
          deletedById,
          reason ?? `حذف همراه دسته «${category.name}»`
        );
      }

      if (activeListIds.length > 0) {
        const listResult = await tx.lists.updateMany({
          where: { id: { in: activeListIds }, deletedAt: null },
          data: {
            deletedAt: now,
            deletedById,
            deleteReason: reason ?? `حذف همراه دسته «${category.name}»`,
            isActive: false,
          },
        });
        listsTrashed = listResult.count;
      }
    }

    await tx.categories.update({
      where: { id: categoryId },
      data: {
        deletedAt: now,
        deletedById,
        deleteReason: reason,
      },
    });
  });

  return { listsTrashed, itemsTrashed };
}

export function formatCategoryTrashMessage(result: CategoryTrashResult): string {
  const parts = ['دسته به زباله‌دان منتقل شد'];
  if (result.listsTrashed > 0) {
    parts.push(`${result.listsTrashed.toLocaleString('fa-IR')} لیست`);
  }
  if (result.itemsTrashed > 0) {
    parts.push(`${result.itemsTrashed.toLocaleString('fa-IR')} آیتم`);
  }
  if (result.listsTrashed > 0 || result.itemsTrashed > 0) {
    return `${parts[0]} (${parts.slice(1).join(' · ')})`;
  }
  return parts[0];
}
