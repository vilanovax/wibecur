import { revalidatePath, revalidateTag } from 'next/cache';
import { LISTS_BROWSE_CACHE_TAG } from '@/lib/lists-browse-shared';

/**
 * تگ‌های کش صفحات عمومی و توابع باطل‌سازی — برای تازگی بدون اتکای صرف به TTL.
 * بعد از هر ویرایش محتوا، تگ مربوطه + مسیر صفحه revalidate می‌شود تا
 * هم Data Cache و هم Full Route Cache (ISR) تازه شوند.
 */

export const HOME_CACHE_TAG = 'home';
export const TRENDING_CACHE_TAG = 'trending';
export { LISTS_BROWSE_CACHE_TAG };

export const listDetailCacheTag = (slug: string) => `list-slug-${slug}`;
export const categoryCacheTag = (categoryId: string) => `category-${categoryId}`;
export const itemDetailCacheTag = (itemId: string) => `item-${itemId}`;
export const publicProfileCacheTag = (username: string) =>
  `public-profile-${username.toLowerCase()}`;

function safeRevalidatePath(path: string, type?: 'page' | 'layout'): void {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch {
    // خارج از request scope (اسکریپت/تست)
  }
}

function safeRevalidateTag(tag: string): void {
  try {
    revalidateTag(tag, 'max');
  } catch {
    // خارج از request scope (اسکریپت/تست)
  }
}

/** هوم + ترند + browse لیست‌ها — بعد از تغییری که ترکیب عمومی را عوض می‌کند. */
export function revalidateHomeCache(): void {
  safeRevalidateTag(HOME_CACHE_TAG);
  safeRevalidateTag(TRENDING_CACHE_TAG);
  safeRevalidateTag(LISTS_BROWSE_CACHE_TAG);
  safeRevalidatePath('/');
  safeRevalidatePath('/lists');
  safeRevalidatePath('/explore');
}

/** صفحهٔ جزئیات یک لیست خاص. */
export function revalidateListDetailCache(slug: string | null | undefined): void {
  if (!slug) return;
  safeRevalidateTag(listDetailCacheTag(slug));
  safeRevalidatePath(`/lists/${slug}`);
}

/** صفحهٔ جزئیات یک آیتم. */
export function revalidateItemDetailCache(itemId: string | null | undefined): void {
  if (!itemId) return;
  safeRevalidateTag(itemDetailCacheTag(itemId));
  safeRevalidatePath(`/items/${itemId}`);
}

/** دادهٔ صفحهٔ یک دستهٔ خاص. */
export function revalidateCategoryCache(
  categoryId: string | null | undefined,
  categorySlug?: string | null
): void {
  if (!categoryId && !categorySlug) return;
  if (categoryId) safeRevalidateTag(categoryCacheTag(categoryId));
  safeRevalidatePath('/categories', 'layout');
  if (categorySlug) safeRevalidatePath(`/categories/${categorySlug}`);
}

/** منوی چیپس دسته‌ها (روی همهٔ صفحات مشترک است). */
export function revalidateCategoryMenuCache(): void {
  safeRevalidateTag('category-menu');
  safeRevalidatePath('/categories', 'layout');
}
