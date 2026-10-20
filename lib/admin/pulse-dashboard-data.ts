import { getCachedPulseOverview } from '@/app/api/admin/pulse/overview/route';
import { getCachedPulseCategories } from '@/app/api/admin/pulse/categories/route';
import { getCachedPulseSuggestions } from '@/app/api/admin/pulse/suggestions/route';
import { getCachedPulseTrending } from '@/app/api/admin/pulse/trending-lists/route';
import { getCachedLiveActivity } from '@/lib/admin/live-activity';

/** یک بار روی سرور، به‌جای چهار درخواست جدا بعد از لود جاوااسکریپت. */
export async function loadPulseDashboard() {
  const [overview, trendingLists, categories, suggestions, activity] = await Promise.all([
    getCachedPulseOverview(),
    getCachedPulseTrending(),
    getCachedPulseCategories(),
    getCachedPulseSuggestions(),
    getCachedLiveActivity(),
  ]);

  return {
    overview,
    trendingLists,
    categories,
    suggestions,
    activity,
  };
}

export type PulseDashboardData = Awaited<ReturnType<typeof loadPulseDashboard>>;
