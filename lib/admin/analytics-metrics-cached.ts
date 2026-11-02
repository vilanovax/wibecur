import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  getAnalyticsOverview,
  type AnalyticsRangeDays,
} from './analytics-metrics';
import { ADMIN_ANALYTICS_CACHE_SECONDS, ADMIN_CACHE_TAGS } from './admin-cache';

/**
 * نسخهٔ کش‌شدهٔ نمای کلی آنالیتیکس (به تفکیک بازهٔ روز).
 */
export function getCachedAnalyticsOverview(windowDays: AnalyticsRangeDays = 7) {
  const cached = unstable_cache(
    () => getAnalyticsOverview(prisma, windowDays),
    ['admin-analytics-overview', String(windowDays)],
    {
      revalidate: ADMIN_ANALYTICS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.analytics],
    }
  );
  return cached();
}
