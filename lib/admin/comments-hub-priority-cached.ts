import { unstable_cache } from 'next/cache';
import {
  getCommentsHubPriorityItems,
  type HubPriorityItem,
} from './comments-hub-priority';
import { ADMIN_CACHE_TAGS, ADMIN_COMMENTS_CACHE_SECONDS } from './admin-cache';

/**
 * نسخهٔ کش‌شدهٔ صف اولویت داشبورد کامنت‌ها.
 *
 * صفحهٔ اصلی داشبورد تنها صفحه‌ای بود که از نسخهٔ خام (بدون کش) استفاده می‌کرد
 * (همهٔ زیرصفحه‌ها کش‌شده‌اند). با tag `admin-comments` پس از هر mutation کامنت
 * ابطال می‌شود.
 */
export function getCachedCommentsHubPriorityItems(limit = 5): Promise<HubPriorityItem[]> {
  return unstable_cache(
    () => getCommentsHubPriorityItems(limit),
    ['admin-comments-hub-priority', String(limit)],
    { revalidate: ADMIN_COMMENTS_CACHE_SECONDS, tags: [ADMIN_CACHE_TAGS.comments] }
  )();
}
