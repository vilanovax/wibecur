import { Suspense, type ReactNode } from 'react';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CuratedLandingPageClient from '@/components/mobile/curated/CuratedLandingPageClient';
import ExploreLcpPreload from '@/components/mobile/curated/ExploreLcpPreload';
import ExploreTrendingServer from '@/components/mobile/curated/ExploreTrendingServer';
import {
  EMPTY_EXPLORE_USER_PREFERENCES,
  fetchExploreBasePayload,
  type ExplorePayload,
} from '@/lib/curated/explore-data';
import {
  selectExploreLcpImageUrl,
  selectExploreTrendingLists,
} from '@/lib/curated/explore-sections';
import { ExplorePageSkeleton } from '@/components/mobile/curated/ExplorePageSkeleton';

export const revalidate = 60;

export const metadata = {
  title: 'اکسپلور',
  description:
    'کشف لیست‌ها بر اساس حال‌وهوا و ترندها — نقطه شروع کشف mood-first در وایب',
};

/**
 * دادهٔ اکسپلور داخل Suspense await می‌شود تا shell (Header/BottomNav)
 * بلافاصله استریم شود و کاربر منتظر کل payload نماند.
 */
async function ExploreContent() {
  let initialData: ExplorePayload | undefined;
  let trendingSlot: ReactNode = null;
  let lcpImage: string | null = null;

  try {
    const base = await fetchExploreBasePayload();
    initialData = { ...base, ...EMPTY_EXPLORE_USER_PREFERENCES };

    const activeCategoryIds = base.categories
      .filter((c) => c.id !== 'all')
      .map((c) => c.id);
    const trendingLists = selectExploreTrendingLists(base.lists, { activeCategoryIds });
    lcpImage = selectExploreLcpImageUrl(trendingLists);

    if (trendingLists.length > 0) {
      trendingSlot = (
        <ExploreTrendingServer lists={trendingLists} subtitle="محبوب‌ترین‌ها همین الان" />
      );
    }
  } catch (err) {
    console.warn('[ExplorePage] SSR explore fetch failed, falling back to client fetch:', err);
  }

  return (
    <>
      <ExploreLcpPreload href={lcpImage} />
      <CuratedLandingPageClient initialData={initialData} trendingSlot={trendingSlot} />
    </>
  );
}

/**
 * مسیر رسمی اکسپلور (کشف mood-first).
 * /user-lists فقط لندینگ قدیمی است و به اینجا redirect می‌شود؛
 * جزئیات لیست شخصی همچنان روی /user-lists/[id] می‌ماند.
 */
export default function ExplorePage() {
  return (
    <div className="bg-wibe-surface">
      <Header title="اکسپلور" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <Suspense fallback={<ExplorePageSkeleton />}>
        <ExploreContent />
      </Suspense>
      <BottomNav />
    </div>
  );
}
