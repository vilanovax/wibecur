'use client';

import type { ReactNode } from 'react';
import HomeStartStrip from '@/components/mobile/home/HomeStartStrip';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeHeroSpotlightSlot from '@/components/mobile/home/HomeHeroSpotlightSlot';
import {
  ForYouSectionLazy,
  HomeSavedListsSectionLazy,
} from '@/components/mobile/home/home-lazy-sections';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import type { CategoryMenuChip } from '@/lib/category-menu';

type HomeMobileViewProps = {
  ssrFeaturedId: string | null;
  heroSpotlight: ReactNode;
  /** RSC feed section (header + SSR trending carousel) */
  mobileFeed: ReactNode;
  initialCategories?: CategoryMenuChip[];
};

/**
 * Distilled + hardened home IA (Operate / save-first):
 * start → hero → trending lane → saved → for you → chips.
 * Trending is streamed as RSC children; personal sections stay dynamic.
 */
export default function HomeMobileView({
  ssrFeaturedId,
  heroSpotlight,
  mobileFeed,
  initialCategories,
}: HomeMobileViewProps) {
  const { isGuest, isLoading: userLoading } = useHomeUserState();
  const showPersonal = !userLoading && !isGuest;

  return (
    <div className="flex flex-col">
      <HomeStartStrip initialCategories={initialCategories} />
      <HomeHeroSpotlightSlot ssrFeaturedId={ssrFeaturedId}>
        {heroSpotlight}
      </HomeHeroSpotlightSlot>
      {mobileFeed}
      {showPersonal ? <HomeSavedListsSectionLazy /> : null}
      {showPersonal ? <ForYouSectionLazy fetchEnabled /> : null}
      <QuickCategoryChips
        initialCategories={initialCategories}
        variant="nav"
        density="secondary"
      />
    </div>
  );
}
