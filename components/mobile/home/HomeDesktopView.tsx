'use client';

import type { ReactNode } from 'react';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeStartStrip from '@/components/mobile/home/HomeStartStrip';
import HomeMoodRowSection from '@/components/mobile/home/HomeMoodRowSection';
import TrendingThisWeekCarousel from '@/components/mobile/home/TrendingThisWeekCarousel';
import HomeFeedSection from '@/components/mobile/home/HomeFeedSection';
import HomeDeferredMount from '@/components/mobile/home/HomeDeferredMount';
import HomeHeroSpotlightSlot from '@/components/mobile/home/HomeHeroSpotlightSlot';
import HomeSectionRefreshSlot from '@/components/mobile/home/HomeSectionRefreshSlot';
import { HomeFeedSectionSkeleton } from '@/components/mobile/home/home-section-skeletons';
import {
  HomeSavedListsSectionLazy,
  ForYouSectionLazy,
  HomePersonalizedFeedSectionLazy,
} from '@/components/mobile/home/home-lazy-sections';
import { useHomeUserState } from '@/hooks/useHomeUserState';

type HomeDesktopViewProps = {
  ssrFeaturedId: string | null;
  heroSpotlight: ReactNode;
  desktopTrending: ReactNode;
};

/**
 * چیدمان دسکتاپ — Magazine / Editorial
 * xl: هیرو + حال‌وهوا کنار هم | بقیه سکشن‌ها تمام‌عرض
 */
export default function HomeDesktopView({
  ssrFeaturedId,
  heroSpotlight,
  desktopTrending,
}: HomeDesktopViewProps) {
  const { hasSaves, isLoggedIn, isLoading: userLoading } = useHomeUserState();
  const showCombinedPersonal = isLoggedIn && hasSaves && !userLoading;

  return (
    <div className="flex flex-col gap-6 xl:gap-7">
      <QuickCategoryChips />

      <HomeStartStrip />

      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.55fr)] xl:items-stretch xl:gap-5">
        <div className="hidden xl:block">
          <HomeMoodRowSection variant="sidebar" />
        </div>
        <HomeHeroSpotlightSlot ssrFeaturedId={ssrFeaturedId} fillHeight>
          {heroSpotlight}
        </HomeHeroSpotlightSlot>
        <div className="xl:hidden">
          <HomeMoodRowSection />
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:gap-7">
        <HomeFeedSection divider>
          <HomeSectionRefreshSlot fallback={<TrendingThisWeekCarousel />}>
            {desktopTrending}
          </HomeSectionRefreshSlot>
        </HomeFeedSection>

        {showCombinedPersonal ? (
          <HomeFeedSection divider>
            <HomeDeferredMount fallback={<HomeFeedSectionSkeleton titleWidth="w-24" />}>
              <HomePersonalizedFeedSectionLazy />
            </HomeDeferredMount>
          </HomeFeedSection>
        ) : (
          <>
            <HomeFeedSection divider>
              <HomeDeferredMount fallback={<HomeFeedSectionSkeleton />}>
                <HomeSavedListsSectionLazy />
              </HomeDeferredMount>
            </HomeFeedSection>
            <HomeFeedSection divider>
              <HomeDeferredMount fallback={<HomeFeedSectionSkeleton titleWidth="w-32" />}>
                <ForYouSectionLazy />
              </HomeDeferredMount>
            </HomeFeedSection>
          </>
        )}

      </div>
    </div>
  );
}
