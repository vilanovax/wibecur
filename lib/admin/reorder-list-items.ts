import { Prisma, type PrismaClient } from '@prisma/client';
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
  // یک UPDATE دسته‌ای — بدون unique روی (listId, order) نیازی به دو پاس منفی نیست
  // و برای لیست‌های بزرگ timeout تراکنش ترتیبی رخ نمی‌دهد.
  const valueRows = unique.map(
    (id, i) => Prisma.sql`(${id}, ${i}::int)`
  );
  await prisma.$executeRaw`
    UPDATE items AS i
    SET
      "order" = v.ord,
      "updatedAt" = ${now}
    FROM (VALUES ${Prisma.join(valueRows)}) AS v(id, ord)
    WHERE i.id = v.id
      AND i."listId" = ${listId}
      AND i."deletedAt" IS NULL
  `;

  revalidateListDetailCache(list.slug);
  revalidateCategoryCache(list.categoryId);

  return {
    listId,
    orderedIds: unique,
    itemCount: unique.length,
  };
}

/**
 * ترتیب زندهٔ لیست را به ۰…n-۱ یکتا و متراکم می‌کند
 * (پایدار نسبت به order فعلی، سپس createdAt، سپس id).
 */
export async function renormalizeListItemOrders(
  prisma: PrismaClient,
  listId: string
): Promise<ReorderListItemsResult> {
  const live = await prisma.items.findMany({
    where: { listId, deletedAt: null },
    select: { id: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
  if (live.length === 0) {
    return { listId, orderedIds: [], itemCount: 0 };
  }
  return reorderListItems(
    prisma,
    listId,
    live.map((row) => row.id)
  );
}
