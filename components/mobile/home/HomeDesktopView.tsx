'use client';

import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeStartStrip from '@/components/mobile/home/HomeStartStrip';
import HomeHeroSpotlight from '@/components/mobile/home/HomeHeroSpotlight';
import TrendingThisWeekCarousel from '@/components/mobile/home/TrendingThisWeekCarousel';
import HomeSavedListsSection from '@/components/mobile/home/HomeSavedListsSection';
import ForYouSection from '@/components/mobile/home/ForYouSection';
import HomePersonalizedFeedSection from '@/components/mobile/home/HomePersonalizedFeedSection';
import HomeMoodRowSection from '@/components/mobile/home/HomeMoodRowSection';
import NewAndRisingSection from '@/components/mobile/home/NewAndRisingSection';
import HomeFeedSection from '@/components/mobile/home/HomeFeedSection';
import { useHomeUserState } from '@/hooks/useHomeUserState';

/**
 * چیدمان دسکتاپ — Magazine / Editorial
 * xl: هیرو + حال‌وهوا کنار هم | بقیه سکشن‌ها تمام‌عرض
 */
export default function HomeDesktopView() {
  const { hasSaves, isLoggedIn, isLoading: userLoading } = useHomeUserState();
  const showCombinedPersonal = isLoggedIn && hasSaves && !userLoading;

  return (
    <div className="hidden lg:flex lg:flex-col lg:gap-6 xl:gap-7">
      <QuickCategoryChips />

      <HomeStartStrip />

      {/* xl: هیرو (راست) + mood (چپ) */}
      <div className="hidden xl:grid xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.55fr)] xl:items-stretch xl:gap-5">
        <HomeMoodRowSection variant="sidebar" />
        <HomeHeroSpotlight fillHeight />
      </div>

      <div className="flex flex-col gap-6 xl:hidden">
        <HomeHeroSpotlight />
        <HomeMoodRowSection />
      </div>

      <div className="flex flex-col gap-6 xl:gap-7">
        <HomeFeedSection divider>
          <TrendingThisWeekCarousel />
        </HomeFeedSection>

        {showCombinedPersonal ? (
          <HomeFeedSection divider>
            <HomePersonalizedFeedSection />
          </HomeFeedSection>
        ) : (
          <>
            <HomeFeedSection divider>
              <HomeSavedListsSection />
            </HomeFeedSection>
            <HomeFeedSection divider>
              <ForYouSection />
            </HomeFeedSection>
          </>
        )}

        <HomeFeedSection divider>
          <NewAndRisingSection />
        </HomeFeedSection>
      </div>
    </div>
  );
}
