import { unstable_cache } from 'next/cache';
import { getDashboardData } from './dashboard-data';
import type { DashboardRange } from './dashboard-range';

/**
 * نسخهٔ کش‌شدهٔ دادهٔ داشبورد ادمین.
 *
 * بدون کش، هر بار باز کردن داشبورد ~۲۶ کوئری اجرا می‌شود. این wrapper نتیجه را
 * به‌ازای هر بازهٔ زمانی برای مدت کوتاهی کش می‌کند تا ناوبری رفت‌وبرگشتی فشار
 * زیادی به DB نیاورد. TTL کوتاه است تا داده تقریباً تازه بماند؛ برای ابطال
 * فوری بعد از اقدام می‌توان از `revalidateTag('admin-dashboard')` استفاده کرد.
 */
const DASHBOARD_TTL_SECONDS = 45;

export function getCachedDashboardData(range: DashboardRange) {
  const cached = unstable_cache(
    () => getDashboardData(range),
    ['admin-dashboard-data', range],
    { revalidate: DASHBOARD_TTL_SECONDS, tags: ['admin-dashboard'] }
  );
  return cached();
}
