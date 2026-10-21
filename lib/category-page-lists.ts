import { excludeListsByIds } from '@/lib/dedupe-lists';
import { CATEGORY_TRENDING_VISIBLE } from '@/lib/category-layout';

/**
 * لیست‌های جدید صفحهٔ دسته، بدون تکرار با چیزی که همان صفحه نشان می‌دهد.
 * اولویت با داغ‌ترین‌هاست؛ اسپات‌لایت هم حذف می‌شود مگر اینکه همان کارت اول داغ باشد
 * (در آن حالت جدا رندر نمی‌شود و از همان گرید حذف شده است).
 */
export function pickCategoryNewLists<T extends { id: string }>(
  candidates: readonly T[],
  trending: readonly { id: string }[],
  viral: { id: string } | null,
  limit: number
): T[] {
  const exclude = new Set(
    trending.slice(0, CATEGORY_TRENDING_VISIBLE).map((list) => list.id)
  );
  if (viral && viral.id !== trending[0]?.id) {
    exclude.add(viral.id);
  }
  return excludeListsByIds(candidates, exclude).slice(0, limit);
}
