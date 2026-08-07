'use client';

import type { ReactNode } from 'react';
import HomeStartStrip from '@/components/mobile/home/HomeStartStrip';
import HomeExploreTeaser from '@/components/mobile/home/HomeExploreTeaser';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeFeedTabs from '@/components/mobile/home/HomeFeedTabs';
import HomeDeferredMount from '@/components/mobile/home/HomeDeferredMount';
import HomeHeroSpotlightSlot from '@/components/mobile/home/HomeHeroSpotlightSlot';
import { HomeFeedSectionSkeleton } from '@/components/mobile/home/home-section-skeletons';
import { HomeSavedListsSectionLazy } from '@/components/mobile/home/home-lazy-sections';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import type { CategoryMenuChip } from '@/lib/category-menu';

type HomeMobileViewProps = {
  ssrFeaturedId: string | null;
  heroSpotlight: ReactNode;
  initialCategories?: CategoryMenuChip[];
};

/**
 * First viewport: start strip (در صورت نیاز) + هیرو.
 * دسته و تیزر اکسپلور زیر fold — مود کامل فقط در /explore.
 */
export default function HomeMobileView({
  ssrFeaturedId,
  heroSpotlight,
  initialCategories,
}: HomeMobileViewProps) {
  const { isGuest, isLoading: userLoading } = useHomeUserState();

  return (
    <div className="flex flex-col">
      <HomeStartStrip />
      <HomeHeroSpotlightSlot ssrFeaturedId={ssrFeaturedId}>{heroSpotlight}</HomeHeroSpotlightSlot>
      <QuickCategoryChips initialCategories={initialCategories} />
      <HomeExploreTeaser />
      <HomeFeedTabs />
      {!userLoading && !isGuest ? (
        <HomeDeferredMount fallback={<HomeFeedSectionSkeleton />}>
          <HomeSavedListsSectionLazy />
        </HomeDeferredMount>
      ) : null}
    </div>
  );
}
