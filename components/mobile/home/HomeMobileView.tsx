'use client';

import type { ReactNode } from 'react';
import HomeStartStrip from '@/components/mobile/home/HomeStartStrip';
import HomeMoodRowSection from '@/components/mobile/home/HomeMoodRowSection';
import HomeFeedTabs from '@/components/mobile/home/HomeFeedTabs';
import HomeDeferredMount from '@/components/mobile/home/HomeDeferredMount';
import HomeHeroSpotlightSlot from '@/components/mobile/home/HomeHeroSpotlightSlot';
import { HomeFeedSectionSkeleton } from '@/components/mobile/home/home-section-skeletons';
import { HomeSavedListsSectionLazy } from '@/components/mobile/home/home-lazy-sections';

type HomeMobileViewProps = {
  ssrFeaturedId: string | null;
  heroSpotlight: ReactNode;
};

export default function HomeMobileView({ ssrFeaturedId, heroSpotlight }: HomeMobileViewProps) {
  return (
    <div className="flex flex-col">
      <HomeStartStrip />
      <HomeHeroSpotlightSlot ssrFeaturedId={ssrFeaturedId}>{heroSpotlight}</HomeHeroSpotlightSlot>
      <HomeMoodRowSection />
      <HomeFeedTabs />
      <HomeDeferredMount fallback={<HomeFeedSectionSkeleton />}>
        <HomeSavedListsSectionLazy />
      </HomeDeferredMount>
    </div>
  );
}
