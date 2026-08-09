'use client';

import { type ReactNode } from 'react';
import { useHomeData } from '@/contexts/HomeDataContext';
import HomeHeroSpotlight from '@/components/mobile/home/HomeHeroSpotlight';

type HomeHeroSpotlightSlotProps = {
  children: ReactNode;
  ssrFeaturedId: string | null;
  fillHeight?: boolean;
};

/** SSR hero by default; client hero only when featured id changes after refresh. */
export default function HomeHeroSpotlightSlot({
  children,
  ssrFeaturedId,
  fillHeight = false,
}: HomeHeroSpotlightSlotProps) {
  const { data } = useHomeData();
  const featuredId = data?.featured?.id ?? null;

  const useClientHero =
    ssrFeaturedId !== null && featuredId !== null && featuredId !== ssrFeaturedId;

  if (useClientHero) {
    return <HomeHeroSpotlight fillHeight={fillHeight} />;
  }

  if (!ssrFeaturedId && !featuredId) return null;

  return <>{children}</>;
}
