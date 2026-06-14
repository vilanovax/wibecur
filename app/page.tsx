import Header from '@/components/mobile/layout/Header';
import HomeSearchBar from '@/components/mobile/home/HomeSearchBar';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeHeroSpotlight from '@/components/mobile/home/HomeHeroSpotlight';
import HomeFeedTabs from '@/components/mobile/home/HomeFeedTabs';
import HomePullToRefresh from '@/components/mobile/home/HomePullToRefresh';
import HomeDesktopView from '@/components/mobile/home/HomeDesktopView';
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

export default async function Home() {
  let initialHomeData = EMPTY_HOME_DATA;
  try {
    initialHomeData = await fetchHomePageData();
  } catch (err) {
    console.warn('Home SSR data fetch failed:', err);
  }

  return (
    <div className="flex flex-col lg:bg-transparent" dir="rtl">
      <Header hideTitleOnDesktop hideOnDesktop />
      <main className="min-w-0 flex-1 pt-2 lg:pt-0">
        <HomeDataProvider initialData={initialHomeData}>
          <ErrorBoundary>
            {/* موبایل: جستجو + دسته‌ها */}
            <div className="sticky top-14 z-10 border-b border-wibe/50 bg-wibe-surface/95 pb-2 pt-1 backdrop-blur-sm lg:hidden">
              <HomeSearchBar />
              <QuickCategoryChips />
            </div>

            <HomePullToRefresh>
              <HomeDesktopView />

              {/* موبایل */}
              <div className="flex flex-col lg:hidden">
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
