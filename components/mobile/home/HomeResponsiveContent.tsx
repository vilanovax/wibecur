'use client';

import type { ReactNode } from 'react';
import HomeSearchBar from '@/components/mobile/home/HomeSearchBar';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomePullToRefresh from '@/components/mobile/home/HomePullToRefresh';
import HomeDesktopView from '@/components/mobile/home/HomeDesktopView';
import HomeMobileView from '@/components/mobile/home/HomeMobileView';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';

type HomeResponsiveContentProps = {
  ssrFeaturedId: string | null;
  heroSpotlightMobile: ReactNode;
  heroSpotlightDesktop: ReactNode;
  desktopTrending: ReactNode;
  desktopRising: ReactNode;
};

export default function HomeResponsiveContent({
  ssrFeaturedId,
  heroSpotlightMobile,
  heroSpotlightDesktop,
  desktopTrending,
  desktopRising,
}: HomeResponsiveContentProps) {
  const isDesktop = useIsDesktop();

  return (
    <>
      {!isDesktop ? (
        <div className="sticky top-14 z-10 border-b border-wibe/50 bg-wibe-surface/95 pb-1.5 pt-0.5 backdrop-blur-sm">
          <HomeSearchBar />
          <QuickCategoryChips />
        </div>
      ) : null}

      <HomePullToRefresh>
        {isDesktop ? (
          <HomeDesktopView
            ssrFeaturedId={ssrFeaturedId}
            heroSpotlight={heroSpotlightDesktop}
            desktopTrending={desktopTrending}
            desktopRising={desktopRising}
          />
        ) : (
          <HomeMobileView
            ssrFeaturedId={ssrFeaturedId}
            heroSpotlight={heroSpotlightMobile}
          />
        )}
      </HomePullToRefresh>
    </>
  );
}
