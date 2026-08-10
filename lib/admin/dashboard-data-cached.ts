import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getDashboardData } from './dashboard-data';
import type { DashboardRange } from './dashboard-range';

/**
 * نسخهٔ کش‌شدهٔ دادهٔ داشبورد ادمین.
 *
 * - React.cache: dedupe داخل همان request (server-cache-react)
 * - unstable_cache: TTL کوتاه بین requestها تا ناوبری رفت‌وبرگشتی فشار DB نیاورد
 *
 * برای ابطال فوری: `revalidateTag('admin-dashboard')`
 */
const DASHBOARD_TTL_SECONDS = 45;

function getCrossRequestCachedDashboardData(range: DashboardRange) {
  const cached = unstable_cache(
    () => getDashboardData(range),
    ['admin-dashboard-data', range],
    { revalidate: DASHBOARD_TTL_SECONDS, tags: ['admin-dashboard'] }
  );
  return cached();
}

export const getCachedDashboardData = cache(
  (range: DashboardRange) => getCrossRequestCachedDashboardData(range)
);
