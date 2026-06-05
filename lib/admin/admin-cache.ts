import { revalidateTag } from 'next/cache';

/** TTL کش پنل ادمین (ثانیه) */
export const ADMIN_LISTS_CACHE_SECONDS = 120;
export const ADMIN_CATEGORIES_CACHE_SECONDS = 180;
export const ADMIN_USERS_CACHE_SECONDS = 120;
export const ADMIN_COMMENTS_CACHE_SECONDS = 90;

export const ADMIN_CACHE_TAGS = {
  lists: 'admin-lists',
  categories: 'admin-categories',
  users: 'admin-users',
  comments: 'admin-comments',
  commentReports: 'admin-comment-reports',
} as const;

export function revalidateAdminListsCache() {
  revalidateTag(ADMIN_CACHE_TAGS.lists, 'max');
}

export function revalidateAdminCategoriesCache() {
  revalidateTag(ADMIN_CACHE_TAGS.categories, 'max');
}

export function revalidateAdminUsersCache() {
  revalidateTag(ADMIN_CACHE_TAGS.users, 'max');
}

export function revalidateAdminCommentsCache() {
  revalidateTag(ADMIN_CACHE_TAGS.comments, 'max');
  revalidateTag(ADMIN_CACHE_TAGS.commentReports, 'max');
}

export function revalidateAdminListsAndCategoriesCache() {
  revalidateAdminListsCache();
  revalidateAdminCategoriesCache();
  /** هوم و ترند — بعد از فعال/غیرفعال شدن دسته */
  revalidateTag('trending', 'max');
}

export function revalidateAdminPanelCaches() {
  revalidateAdminListsCache();
  revalidateAdminCategoriesCache();
  revalidateAdminUsersCache();
  revalidateAdminCommentsCache();
}
