'use client';

import type { ReactNode } from 'react';
import HomeStartStrip from '@/components/mobile/home/HomeStartStrip';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeHeroSpotlightSlot from '@/components/mobile/home/HomeHeroSpotlightSlot';
import HomeDeferredMount from '@/components/mobile/home/HomeDeferredMount';
import { HomeFeedSectionSkeleton } from '@/components/mobile/home/home-section-skeletons';
import {
  ForYouSectionLazy,
  HomeSavedListsSectionLazy,
} from '@/components/mobile/home/home-lazy-sections';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { useHomeOnboardingInterests } from '@/hooks/useHomeOnboardingInterests';
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
 * start → hero → trending lane → saved (after onboarding) → for you row → chips.
 * Trending is streamed as RSC children; personal sections stay dynamic.
 */
export default function HomeMobileView({
  ssrFeaturedId,
  heroSpotlight,
  mobileFeed,
  initialCategories,
}: HomeMobileViewProps) {
  const { isGuest, isNewUser, isLoading: userLoading } = useHomeUserState();
  const { shouldShowStartStrip, hydrated } = useHomeOnboardingInterests();
  const onboarding = (!hydrated && isNewUser) || (hydrated && shouldShowStartStrip && isNewUser);
  const showSaved = !userLoading && !isGuest && !onboarding;
  const showForYou = !userLoading && !isGuest;

  return (
    <div className="flex flex-col">
      <HomeStartStrip initialCategories={initialCategories} />
      <HomeHeroSpotlightSlot ssrFeaturedId={ssrFeaturedId}>
        {heroSpotlight}
      </HomeHeroSpotlightSlot>
      {mobileFeed}
      {showSaved ? (
        <HomeDeferredMount
          rootMargin="200px"
          fallback={<HomeFeedSectionSkeleton titleWidth="w-36" />}
        >
          <HomeSavedListsSectionLazy />
        </HomeDeferredMount>
      ) : null}
      {showForYou ? (
        <HomeDeferredMount
          rootMargin="240px"
          fallback={<HomeFeedSectionSkeleton titleWidth="w-32" />}
        >
          <ForYouSectionLazy />
        </HomeDeferredMount>
      ) : null}
      <QuickCategoryChips
        initialCategories={initialCategories}
        variant="nav"
        density="secondary"
      />
    </div>
  );
}
