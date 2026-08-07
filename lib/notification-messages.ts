import { catalogCategoryLabel } from '@/lib/catalog-display';

/** برچسب نوع آیتم برای پیام اعلان — مثلاً «فیلم»، «رستوران» */
export function resolveItemTypeLabel(
  categorySlug: string | null | undefined,
  categoryName: string | null | undefined
): string {
  if (categoryName?.trim()) {
    return categoryName.trim();
  }
  const fromSlug = catalogCategoryLabel(categorySlug);
  return fromSlug === 'بدون دسته' ? 'آیتم' : fromSlug;
}

export function formatListItemAddedNotification(
  itemCount: number,
  itemTypeLabel: string,
  listTitle: string
): { title: string; message: string } {
  const countFa = Math.max(1, itemCount).toLocaleString('fa-IR');
  const quotedList = `«${listTitle.trim() || 'لیست'}»`;

  return {
    title: 'لیست ذخیره‌شده به‌روز شد',
    message: `${countFa} ${itemTypeLabel} به ${quotedList} اضافه شد`,
  };
}
