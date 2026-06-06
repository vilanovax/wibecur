import type { PrismaClient } from '@prisma/client';

export type ItemBulkAction =
  | 'delete'
  | 'hide'
  | 'show'
  | 'disable-comments'
  | 'enable-comments';

export type ItemBulkResult = {
  processed: number;
  skipped: number;
  errors: string[];
  message: string;
};

type BulkInput = {
  itemIds: string[];
  action: ItemBulkAction;
};

async function decrementListCounts(
  prisma: PrismaClient,
  counts: Map<string, number>
) {
  for (const [listId, count] of counts) {
    if (count <= 0) continue;
    await prisma.lists.update({
      where: { id: listId },
      data: { itemCount: { decrement: count } },
    });
  }
}

async function deletePlacements(
  prisma: PrismaClient,
  placements: { id: string; listId: string }[]
): Promise<number> {
  if (placements.length === 0) return 0;

  const listCounts = new Map<string, number>();
  for (const p of placements) {
    listCounts.set(p.listId, (listCounts.get(p.listId) ?? 0) + 1);
  }

  await prisma.items.deleteMany({
    where: { id: { in: placements.map((p) => p.id) } },
  });
  await decrementListCounts(prisma, listCounts);
  return placements.length;
}

async function setItemsModerationStatus(
  prisma: PrismaClient,
  itemIds: string[],
  status: 'NORMAL' | 'HIDDEN'
): Promise<number> {
  let processed = 0;
  for (const itemId of itemIds) {
    await prisma.item_moderation.upsert({
      where: { itemId },
      create: { itemId, status, flagScore: 0 },
      update: { status },
    });
    processed += 1;
  }
  return processed;
}

export async function executeItemBulkAction(
  prisma: PrismaClient,
  input: BulkInput
): Promise<ItemBulkResult> {
  const itemIds = [...new Set(input.itemIds.filter(Boolean))];
  const errors: string[] = [];
  let processed = 0;
  let skipped = 0;

  if (itemIds.length === 0) {
    return { processed: 0, skipped: 0, errors: ['هیچ آیتمی انتخاب نشده'], message: '' };
  }

  if (itemIds.length > 100) {
    return {
      processed: 0,
      skipped: 0,
      errors: ['حداکثر ۱۰۰ آیتم در هر عملیات'],
      message: '',
    };
  }

  const existing = await prisma.items.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, listId: true },
  });
  const existingIds = new Set(existing.map((i) => i.id));
  skipped = itemIds.length - existing.length;

  switch (input.action) {
    case 'delete': {
      processed = await deletePlacements(prisma, existing);
      break;
    }

    case 'hide':
      processed = await setItemsModerationStatus(
        prisma,
        existing.map((i) => i.id),
        'HIDDEN'
      );
      break;

    case 'show':
      processed = await setItemsModerationStatus(
        prisma,
        existing.map((i) => i.id),
        'NORMAL'
      );
      break;

    case 'disable-comments':
    case 'enable-comments': {
      const enabled = input.action === 'enable-comments';
      const result = await prisma.items.updateMany({
        where: { id: { in: [...existingIds] } },
        data: { commentsEnabled: enabled, updatedAt: new Date() },
      });
      processed = result.count;
      break;
    }

    default:
      return { processed: 0, skipped: 0, errors: ['عملیات نامعتبر'], message: '' };
  }

  const message = buildBulkMessage(input.action, processed, skipped, errors.length);
  return { processed, skipped, errors: errors.slice(0, 8), message };
}

function buildBulkMessage(
  action: ItemBulkAction,
  processed: number,
  skipped: number,
  errorCount: number
): string {
  const labels: Record<ItemBulkAction, string> = {
    delete: 'حذف',
    hide: 'غیرفعال‌سازی',
    show: 'فعال‌سازی',
    'disable-comments': 'غیرفعال‌سازی کامنت',
    'enable-comments': 'فعال‌سازی کامنت',
  };

  const parts = [`${labels[action]}: ${processed.toLocaleString('fa-IR')} مورد`];
  if (skipped > 0) parts.push(`${skipped.toLocaleString('fa-IR')} رد شد`);
  if (errorCount > 0) parts.push(`${errorCount.toLocaleString('fa-IR')} خطا`);
  return parts.join(' · ');
}

export const ITEM_BULK_ACTION_LABELS: Record<
  ItemBulkAction,
  { label: string; description: string; variant: 'danger' | 'default' | 'primary' }
> = {
  delete: {
    label: 'حذف از لیست',
    description:
      'آیتم‌های انتخاب‌شده از لیست حذف می‌شوند. اگر در لیست‌های دیگر هم باشند، آن‌ها باقی می‌مانند.',
    variant: 'danger',
  },
  hide: {
    label: 'غیرفعال کردن (مخفی)',
    description: 'آیتم برای کاربران عادی مخفی می‌شود. قابل بازگشت است.',
    variant: 'default',
  },
  show: {
    label: 'فعال‌سازی (نمایش)',
    description: 'آیتم دوباره برای کاربران نمایش داده می‌شود.',
    variant: 'primary',
  },
  'disable-comments': {
    label: 'بستن کامنت',
    description: 'امکان ثبت کامنت روی آیتم‌های انتخاب‌شده غیرفعال می‌شود.',
    variant: 'default',
  },
  'enable-comments': {
    label: 'باز کردن کامنت',
    description: 'کامنت روی آیتم‌های انتخاب‌شده فعال می‌شود.',
    variant: 'default',
  },
};
