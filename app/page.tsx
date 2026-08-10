import { Suspense, type ReactNode } from 'react';
import Header from '@/components/mobile/layout/Header';
import HomeResponsiveContent from '@/components/mobile/home/HomeResponsiveContent';
import HomeLcpPreload from '@/components/mobile/home/HomeLcpPreload';
import HomeHeroSpotlightServer from '@/components/mobile/home/HomeHeroSpotlightServer';
import HomeTrendingSectionServer from '@/components/mobile/home/HomeTrendingSectionServer';
import HomeFeedTabs from '@/components/mobile/home/HomeFeedTabs';
import HomeTrendingCarouselServer from '@/components/mobile/home/HomeTrendingCarouselServer';
import { HomePageSkeleton } from '@/components/mobile/home/HomePageSkeleton';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { HomeDataProvider } from '@/contexts/HomeDataContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { fetchHomePageData } from '@/lib/home-data-server';
import { fetchActiveCategoryMenu, type CategoryMenuChip } from '@/lib/category-menu';
import {
  selectHomeLcpImageUrl,
  selectHomeTrendingDesktopLists,
  selectHomeTrendingLists,
} from '@/lib/home-list-selectors';
import { EMPTY_HOME_DATA } from '@/types/home-data';
import { toHomeClientSeed } from '@/lib/home-page-client-seed';

export const revalidate = 60;

export const metadata = {
  title: 'خانه',
  description:
    'کشف و اشتراک‌گذاری لیست‌های کیوریتد در حوزه لایف‌استایل - فیلم، کتاب، رستوران، سفر و بیشتر',
};

/**
 * دادهٔ خانه داخل Suspense await می‌شود تا shell (Header/BottomNav)
 * بلافاصله استریم شود و کاربر منتظر کل payload نماند.
 */
async function HomeContent() {
  const [homeResult, menuResult] = await Promise.allSettled([
    fetchHomePageData(),
    fetchActiveCategoryMenu(),
  ]);
  const initialHomeData =
    homeResult.status === 'fulfilled' ? homeResult.value : EMPTY_HOME_DATA;
  if (homeResult.status === 'rejected') {
    console.warn('Home SSR data fetch failed:', homeResult.reason);
  }
  const menuCategories: CategoryMenuChip[] =
    menuResult.status === 'fulfilled' ? menuResult.value : [];

  const ssrFeaturedId = initialHomeData.featured?.id ?? null;
  const lcpImage = selectHomeLcpImageUrl(initialHomeData);
  const desktopTrendingLists = selectHomeTrendingDesktopLists(initialHomeData);
  const mobileTrendingLists = selectHomeTrendingLists(initialHomeData, {
    limit: 12,
    excludeFeatured: true,
  });

  const heroSpotlightMobile: ReactNode =
    initialHomeData.featured != null ? (
      <HomeHeroSpotlightServer
        list={initialHomeData.featured}
        slotId={initialHomeData.featuredSlotId}
      />
    ) : null;

  const heroSpotlightDesktop: ReactNode =
    initialHomeData.featured != null ? (
      <HomeHeroSpotlightServer
        list={initialHomeData.featured}
        slotId={initialHomeData.featuredSlotId}
        fillHeight
      />
    ) : null;

  const mobileFeed: ReactNode = (
    <HomeFeedTabs
      carousel={<HomeTrendingCarouselServer lists={mobileTrendingLists} />}
    />
  );

  return (
    <>
      <HomeLcpPreload href={lcpImage} />
      <HomeDataProvider initialData={toHomeClientSeed(initialHomeData)}>
        <ErrorBoundary>
          <HomeResponsiveContent
            ssrFeaturedId={ssrFeaturedId}
            initialCategories={menuCategories}
            heroSpotlightMobile={heroSpotlightMobile}
            heroSpotlightDesktop={heroSpotlightDesktop}
            mobileFeed={mobileFeed}
            desktopTrending={
              <HomeTrendingSectionServer lists={desktopTrendingLists} />
            }
          />
        </ErrorBoundary>
      </HomeDataProvider>
    </>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col lg:bg-transparent" dir="rtl">
      <Header hideTitleOnDesktop hideOnDesktop />
      <main className="min-w-0 flex-1 pt-2 lg:pt-0">
        <Suspense fallback={<HomePageSkeleton />}>
          <HomeContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
