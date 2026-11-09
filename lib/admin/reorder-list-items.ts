import type { PrismaClient } from '@prisma/client';
import {
  revalidateCategoryCache,
  revalidateListDetailCache,
} from '@/lib/public-cache';

export class ReorderListItemsError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ReorderListItemsError';
    this.status = status;
  }
}

export type ReorderListItemsResult = {
  listId: string;
  orderedIds: string[];
  itemCount: number;
};

/**
 * ترتیب آیتم‌های یک لیست را در یک تراکنش ذخیره می‌کند.
 * `orderedIds` باید دقیقاً همان مجموعهٔ جایگاه‌های زندهٔ لیست باشد (بدون حذف/اضافه).
 */
export async function reorderListItems(
  prisma: PrismaClient,
  listId: string,
  orderedIds: string[]
): Promise<ReorderListItemsResult> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new ReorderListItemsError('لیست ترتیب خالی است', 400);
  }

  const unique = [...new Set(orderedIds.map((id) => String(id).trim()).filter(Boolean))];
  if (unique.length !== orderedIds.length) {
    throw new ReorderListItemsError('شناسهٔ تکراری در ترتیب وجود دارد', 400);
  }

  const list = await prisma.lists.findUnique({
    where: { id: listId },
    select: { id: true, slug: true, categoryId: true, deletedAt: true },
  });
  if (!list || list.deletedAt) {
    throw new ReorderListItemsError('لیست یافت نشد', 404);
  }

  const live = await prisma.items.findMany({
    where: { listId, deletedAt: null },
    select: { id: true },
    orderBy: { order: 'asc' },
  });

  const liveIds = new Set(live.map((row) => row.id));
  if (liveIds.size !== unique.length) {
    throw new ReorderListItemsError(
      'تعداد آیتم‌های ارسالی با لیست هم‌خوانی ندارد؛ صفحه را تازه کن',
      409
    );
  }
  for (const id of unique) {
    if (!liveIds.has(id)) {
      throw new ReorderListItemsError('یکی از آیتم‌ها متعلق به این لیست نیست', 400);
    }
  }

  const now = new Date();
  // دو پاس تا برخورد یکتایی احتمالی روی (listId, order) رخ ندهد
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < unique.length; i++) {
      await tx.items.update({
        where: { id: unique[i] },
        data: { order: -(i + 1), updatedAt: now },
      });
    }
    for (let i = 0; i < unique.length; i++) {
      await tx.items.update({
        where: { id: unique[i] },
        data: { order: i, updatedAt: now },
      });
    }
  });

  revalidateListDetailCache(list.slug);
  revalidateCategoryCache(list.categoryId);

  return {
    listId,
    orderedIds: unique,
    itemCount: unique.length,
  };
}
