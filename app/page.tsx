import Header from '@/components/mobile/layout/Header';
import HomeResponsiveContent from '@/components/mobile/home/HomeResponsiveContent';
import HomeLcpPreload from '@/components/mobile/home/HomeLcpPreload';
import HomeHeroSpotlightServer from '@/components/mobile/home/HomeHeroSpotlightServer';
import HomeTrendingSectionServer from '@/components/mobile/home/HomeTrendingSectionServer';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { HomeDataProvider } from '@/contexts/HomeDataContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { fetchHomePageData } from '@/lib/home-data-server';
import {
  selectHomeLcpImageUrl,
  selectHomeTrendingDesktopLists,
} from '@/lib/home-list-selectors';
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

  const ssrFeaturedId = initialHomeData.featured?.id ?? null;
  const lcpImage = selectHomeLcpImageUrl(initialHomeData);
  const desktopTrendingLists = selectHomeTrendingDesktopLists(initialHomeData);

  const heroSpotlightMobile =
    initialHomeData.featured != null ? (
      <HomeHeroSpotlightServer
        list={initialHomeData.featured}
        slotId={initialHomeData.featuredSlotId}
      />
    ) : null;

  const heroSpotlightDesktop =
    initialHomeData.featured != null ? (
      <HomeHeroSpotlightServer
        list={initialHomeData.featured}
        slotId={initialHomeData.featuredSlotId}
        fillHeight
      />
    ) : null;

  return (
    <>
      <HomeLcpPreload href={lcpImage} />
      <div className="flex flex-col lg:bg-transparent" dir="rtl">
        <Header hideTitleOnDesktop hideOnDesktop />
        <main className="min-w-0 flex-1 pt-2 lg:pt-0">
          <HomeDataProvider initialData={initialHomeData}>
            <ErrorBoundary>
              <HomeResponsiveContent
                ssrFeaturedId={ssrFeaturedId}
                heroSpotlightMobile={heroSpotlightMobile}
                heroSpotlightDesktop={heroSpotlightDesktop}
                desktopTrending={
                  <HomeTrendingSectionServer lists={desktopTrendingLists} />
                }
              />
            </ErrorBoundary>
          </HomeDataProvider>
        </main>
        <BottomNav />
      </div>
    </>
  );
}
