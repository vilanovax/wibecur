import { revalidateTag } from 'next/cache';
import { LISTS_BROWSE_CACHE_TAG } from '@/lib/lists-browse-shared';

/**
 * تگ‌های کش صفحات عمومی و توابع باطل‌سازی — برای تازگی بدون اتکای صرف به TTL.
 * بعد از هر ویرایش محتوا، تگ مربوطه revalidate می‌شود تا کاربر نسخهٔ به‌روز ببیند.
 */

export const HOME_CACHE_TAG = 'home';
export const TRENDING_CACHE_TAG = 'trending';
export { LISTS_BROWSE_CACHE_TAG };

export const listDetailCacheTag = (slug: string) => `list-slug-${slug}`;
export const categoryCacheTag = (categoryId: string) => `category-${categoryId}`;
export const itemDetailCacheTag = (itemId: string) => `item-${itemId}`;
export const publicProfileCacheTag = (username: string) =>
  `public-profile-${username.toLowerCase()}`;

/** هوم + ترند + browse لیست‌ها — بعد از تغییری که ترکیب عمومی را عوض می‌کند. */
export function revalidateHomeCache(): void {
  revalidateTag(HOME_CACHE_TAG, 'max');
  revalidateTag(TRENDING_CACHE_TAG, 'max');
  revalidateTag(LISTS_BROWSE_CACHE_TAG, 'max');
}

/** صفحهٔ جزئیات یک لیست خاص. */
export function revalidateListDetailCache(slug: string | null | undefined): void {
  if (!slug) return;
  revalidateTag(listDetailCacheTag(slug), 'max');
}

/** صفحهٔ جزئیات یک آیتم. */
export function revalidateItemDetailCache(itemId: string | null | undefined): void {
  if (!itemId) return;
  revalidateTag(itemDetailCacheTag(itemId), 'max');
}

/** دادهٔ صفحهٔ یک دستهٔ خاص. */
export function revalidateCategoryCache(categoryId: string | null | undefined): void {
  if (!categoryId) return;
  revalidateTag(categoryCacheTag(categoryId), 'max');
}

/** منوی چیپس دسته‌ها (روی همهٔ صفحات مشترک است). */
export function revalidateCategoryMenuCache(): void {
  revalidateTag('category-menu', 'max');
}
