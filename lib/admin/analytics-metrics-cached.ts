import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAnalyticsOverview } from './analytics-metrics';
import { ADMIN_ANALYTICS_CACHE_SECONDS, ADMIN_CACHE_TAGS } from './admin-cache';

/**
 * نسخهٔ کش‌شدهٔ نمای کلی آنالیتیکس.
 *
 * بدون کش، هر بار باز کردن صفحه ~۱۹ کوئری (شامل چند پویش بزرگ روی bookmarks) اجرا
 * می‌شد. داده روی پنجره‌های ۷/۳۰ روزه است، پس TTL کوتاه کاملاً قابل‌قبول است و
 * بار را به یک چرخه در هر ۱۲۰ ثانیه کاهش می‌دهد. prisma به‌جای آرگومان (که
 * قابل‌سریالایز نیست) از singleton ماژول بسته می‌شود.
 */
export function getCachedAnalyticsOverview() {
  const cached = unstable_cache(
    () => getAnalyticsOverview(prisma),
    ['admin-analytics-overview'],
    { revalidate: ADMIN_ANALYTICS_CACHE_SECONDS, tags: [ADMIN_CACHE_TAGS.analytics] }
  );
  return cached();
}
