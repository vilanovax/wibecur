'use client';

import type { ReactNode } from 'react';
import HomeStartStrip from '@/components/mobile/home/HomeStartStrip';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeFeedTabs from '@/components/mobile/home/HomeFeedTabs';
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
  initialCategories?: CategoryMenuChip[];
};

/**
 * Distilled + hardened home IA (Operate / save-first):
 * start → hero → trending lane → saved → for you → chips.
 * Personal sections mount eagerly (code-split still via dynamic) so returners
 * never sit on forever-pulse shells. Mood stays on /explore.
 */
export default function HomeMobileView({
  ssrFeaturedId,
  heroSpotlight,
  initialCategories,
}: HomeMobileViewProps) {
  const { isGuest, isLoading: userLoading } = useHomeUserState();
  const showPersonal = !userLoading && !isGuest;

  return (
    <div className="flex flex-col">
      <HomeStartStrip />
      <HomeHeroSpotlightSlot ssrFeaturedId={ssrFeaturedId}>{heroSpotlight}</HomeHeroSpotlightSlot>
      <HomeFeedTabs />
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
