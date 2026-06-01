import Header from '@/components/mobile/layout/Header';
import HomeSearchBar from '@/components/mobile/home/HomeSearchBar';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeHeroSpotlight from '@/components/mobile/home/HomeHeroSpotlight';
import HomeFeedTabs from '@/components/mobile/home/HomeFeedTabs';
import HomePullToRefresh from '@/components/mobile/home/HomePullToRefresh';
import CreatorSpotlightSection from '@/components/mobile/home/CreatorSpotlightSection';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { HomeDataProvider } from '@/contexts/HomeDataContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { fetchHomePageData } from '@/lib/home-data-server';
import { EMPTY_HOME_DATA } from '@/types/home-data';

export const revalidate = 60;

export const metadata = {
  title: 'خانه',
  description:
    'کشف و اشتراک‌گذاری لیست‌های کیوریتد در حوزه لایف‌استایل - فیلم، کتاب، رستوران، سفر و بیشتر',
};

/**
 * Hero → Feed tabs (Trending | For You | Rising) → Curator
 * Categories: sticky chips only (+ «همه دسته‌ها»)
 */
export default async function Home() {
  let initialHomeData = EMPTY_HOME_DATA;
  try {
    initialHomeData = await fetchHomePageData();
  } catch (err) {
    console.warn('Home SSR data fetch failed:', err);
  }

  return (
    <div className="min-h-screen bg-wibe-surface" dir="rtl">
      <Header />
      <main className="pt-2 lg:pt-0">
        <HomeDataProvider initialData={initialHomeData}>
          <ErrorBoundary>
            <div className="sticky top-14 z-10 -mt-2 border-b border-wibe/50 bg-wibe-surface pb-1 pt-2 lg:static lg:z-auto lg:border-b-0 lg:pb-2 lg:pt-0">
              <HomeSearchBar />
              <QuickCategoryChips />
            </div>

            <HomePullToRefresh>
              <div className="space-y-0">
                <HomeHeroSpotlight />
                <HomeFeedTabs />
                <CreatorSpotlightSection />
              </div>
            </HomePullToRefresh>
          </ErrorBoundary>
        </HomeDataProvider>
      </main>
      <BottomNav />
    </div>
  );
}
