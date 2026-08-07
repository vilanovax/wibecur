import type { PrismaClient } from '@prisma/client';
import { addCatalogItemToList, isCatalogInList } from '@/lib/catalog-items';
import { softDeleteItems } from '@/lib/admin/item-trash';
import { setCatalogAdminDisabledFlags } from '@/lib/admin/catalog-visibility';
import { notifyListBookmarkers } from '@/lib/utils/notifications';

export type CatalogBulkAction =
  | 'remove-from-list'
  | 'delete-catalog'
  | 'disable-comments'
  | 'enable-comments'
  | 'hide'
  | 'show'
  | 'move-to-list'
  | 'add-to-list';

export type CatalogBulkResult = {
  processed: number;
  skipped: number;
  errors: string[];
  message: string;
};

type BulkInput = {
  catalogIds: string[];
  action: CatalogBulkAction;
  listId?: string;
  targetListId?: string;
};

async function deletePlacements(
  prisma: PrismaClient,
  placements: { id: string; listId: string }[]
): Promise<number> {
  if (placements.length === 0) return 0;
  return softDeleteItems(
    prisma,
    placements.map((p) => p.id)
  );
}

async function setModerationStatus(
  prisma: PrismaClient,
  catalogIds: string[],
  status: 'NORMAL' | 'HIDDEN'
): Promise<number> {
  const placements = await prisma.items.findMany({
    where: { catalogItemId: { in: catalogIds } },
    select: { id: true },
  });

  let processed = 0;
  for (const { id: itemId } of placements) {
    await prisma.item_moderation.upsert({
      where: { itemId },
      create: { itemId, status, flagScore: 0 },
      update: { status },
    });
    processed += 1;
  }
  return processed;
}

export async function executeCatalogBulkAction(
  prisma: PrismaClient,
  input: BulkInput
): Promise<CatalogBulkResult> {
  const catalogIds = [...new Set(input.catalogIds.filter(Boolean))];
  const errors: string[] = [];
  let processed = 0;
  let skipped = 0;

  if (catalogIds.length === 0) {
    return { processed: 0, skipped: 0, errors: ['هیچ آیتمی انتخاب نشده'], message: '' };
  }

  if (catalogIds.length > 100) {
    return {
      processed: 0,
      skipped: 0,
      errors: ['حداکثر ۱۰۰ آیتم در هر عملیات'],
      message: '',
    };
  }

  switch (input.action) {
    case 'remove-from-list': {
      if (!input.listId) {
        return {
          processed: 0,
          skipped: 0,
          errors: ['لیست مبدأ را انتخاب کنید'],
          message: '',
        };
      }
      const placements = await prisma.items.findMany({
        where: { catalogItemId: { in: catalogIds }, listId: input.listId },
        select: { id: true, listId: true },
      });
      processed = await deletePlacements(prisma, placements);
      skipped = catalogIds.length - processed;
      break;
    }

    case 'delete-catalog': {
      const placements = await prisma.items.findMany({
        where: { catalogItemId: { in: catalogIds } },
        select: { id: true, listId: true },
      });
      await deletePlacements(prisma, placements);
      const deleted = await prisma.catalog_items.deleteMany({
        where: { id: { in: catalogIds } },
      });
      processed = deleted.count;
      break;
    }

    case 'disable-comments':
    case 'enable-comments': {
      const enabled = input.action === 'enable-comments';
      const result = await prisma.items.updateMany({
        where: { catalogItemId: { in: catalogIds } },
        data: { commentsEnabled: enabled, updatedAt: new Date() },
      });
      processed = result.count;
      break;
    }

    case 'hide':
      processed = await setModerationStatus(prisma, catalogIds, 'HIDDEN');
      await setCatalogAdminDisabledFlags(prisma, catalogIds, true);
      break;

    case 'show':
      processed = await setModerationStatus(prisma, catalogIds, 'NORMAL');
      await setCatalogAdminDisabledFlags(prisma, catalogIds, false);
      break;

    case 'move-to-list': {
      if (!input.listId || !input.targetListId) {
        return {
          processed: 0,
          skipped: 0,
          errors: ['لیست مبدأ و مقصد را انتخاب کنید'],
          message: '',
        };
      }
      if (input.listId === input.targetListId) {
        return {
          processed: 0,
          skipped: 0,
          errors: ['لیست مبدأ و مقصد یکسان است'],
          message: '',
        };
      }

      for (const catalogId of catalogIds) {
        const placement = await prisma.items.findFirst({
          where: { catalogItemId: catalogId, listId: input.listId },
          select: { id: true },
        });
        if (!placement) {
          skipped += 1;
          continue;
        }
        if (await isCatalogInList(prisma, catalogId, input.targetListId)) {
          errors.push(`«${catalogId.slice(0, 8)}…» در لیست مقصد از قبل هست`);
          skipped += 1;
          continue;
        }
        await prisma.$transaction([
          prisma.items.update({
            where: { id: placement.id },
            data: { listId: input.targetListId, updatedAt: new Date() },
          }),
          prisma.lists.update({
            where: { id: input.listId },
            data: { itemCount: { decrement: 1 } },
          }),
          prisma.lists.update({
            where: { id: input.targetListId },
            data: { itemCount: { increment: 1 } },
          }),
        ]);
        processed += 1;
      }
      break;
    }

    case 'add-to-list': {
      if (!input.targetListId) {
        return {
          processed: 0,
          skipped: 0,
          errors: ['لیست مقصد را انتخاب کنید'],
          message: '',
        };
      }
      for (const catalogId of catalogIds) {
        try {
          if (await isCatalogInList(prisma, catalogId, input.targetListId)) {
            skipped += 1;
            continue;
          }
          await addCatalogItemToList(prisma, {
            catalogItemId: catalogId,
            listId: input.targetListId,
          });
          processed += 1;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'خطا';
          errors.push(msg);
          skipped += 1;
        }
      }
      break;
    }

    default:
      return { processed: 0, skipped: 0, errors: ['عملیات نامعتبر'], message: '' };
  }

  if (input.action === 'add-to-list' && processed > 0 && input.targetListId) {
    notifyListBookmarkers(input.targetListId, { itemCount: processed }).catch(console.error);
  }

  const message = buildBulkMessage(input.action, processed, skipped, errors.length);
  return { processed, skipped, errors: errors.slice(0, 8), message };
}

function buildBulkMessage(
  action: CatalogBulkAction,
  processed: number,
  skipped: number,
  errorCount: number
): string {
  const labels: Record<CatalogBulkAction, string> = {
    'remove-from-list': 'حذف از لیست',
    'delete-catalog': 'حذف کامل',
    'disable-comments': 'غیرفعال‌سازی کامنت',
    'enable-comments': 'فعال‌سازی کامنت',
    hide: 'مخفی‌سازی',
    show: 'نمایش مجدد',
    'move-to-list': 'انتقال به لیست',
    'add-to-list': 'افزودن به لیست',
  };

  const parts = [`${labels[action]}: ${processed.toLocaleString('fa-IR')} مورد`];
  if (skipped > 0) parts.push(`${skipped.toLocaleString('fa-IR')} رد شد`);
  if (errorCount > 0) parts.push(`${errorCount.toLocaleString('fa-IR')} خطا`);
  return parts.join(' · ');
}

export const CATALOG_BULK_ACTION_LABELS: Record<
  CatalogBulkAction,
  { label: string; description: string; variant: 'danger' | 'default' | 'primary' }
> = {
  'remove-from-list': {
    label: 'حذف از لیست',
    description: 'جایگاه آیتم‌های انتخاب‌شده از یک لیست حذف می‌شود (کاتالوگ باقی می‌ماند).',
    variant: 'danger',
  },
  'delete-catalog': {
    label: 'حذف کامل',
    description: 'آیتم از همهٔ لیست‌ها و کاتالوگ حذف می‌شود. غیرقابل بازگشت.',
    variant: 'danger',
  },
  'disable-comments': {
    label: 'غیرفعال کردن کامنت',
    description: 'کامنت روی همهٔ جایگاه‌های این آیتم‌ها بسته می‌شود.',
    variant: 'default',
  },
  'enable-comments': {
    label: 'فعال کردن کامنت',
    description: 'کامنت روی همهٔ جایگاه‌های این آیتم‌ها باز می‌شود.',
    variant: 'default',
  },
  hide: {
    label: 'غیرفعال کردن',
    description: 'آیتم برای کاربران عادی نمایش داده نمی‌شود (فقط ادمین می‌بیند).',
    variant: 'default',
  },
  show: {
    label: 'فعال کردن',
    description: 'آیتم دوباره برای کاربران قابل مشاهده می‌شود.',
    variant: 'primary',
  },
  'move-to-list': {
    label: 'انتقال به لیست دیگر',
    description: 'جایگاه در لیست مبدأ به لیست مقصد منتقل می‌شود.',
    variant: 'primary',
  },
  'add-to-list': {
    label: 'افزودن به لیست',
    description: 'آیتم‌های انتخاب‌شده به لیست جدید اضافه می‌شوند (بدون کپی محتوا).',
    variant: 'primary',
  },
};
