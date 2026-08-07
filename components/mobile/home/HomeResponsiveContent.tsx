'use client';

import type { ReactNode } from 'react';
import HomeSearchBar from '@/components/mobile/home/HomeSearchBar';
import HomePullToRefresh from '@/components/mobile/home/HomePullToRefresh';
import HomeMobileView from '@/components/mobile/home/HomeMobileView';
import HomeDesktopView from '@/components/mobile/home/HomeDesktopView';
import type { CategoryMenuChip } from '@/lib/category-menu';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';

/**
 * هر دو چیدمان با CSS (`lg:`) رندر می‌شوند — نه mount شرطی با useIsDesktop
 * (برای جلوگیری از CLS). فقط aria-hidden از breakpoint برای AT جدا می‌شود.
 *
 * موبایل: استیکی فقط جستجو — چیپ دسته زیر هیرو تا first viewport خلوت بماند.
 */

type HomeResponsiveContentProps = {
  ssrFeaturedId: string | null;
  initialCategories?: CategoryMenuChip[];
  heroSpotlightMobile: ReactNode;
  heroSpotlightDesktop: ReactNode;
  desktopTrending: ReactNode;
};

export default function HomeResponsiveContent({
  ssrFeaturedId,
  initialCategories,
  heroSpotlightMobile,
  heroSpotlightDesktop,
  desktopTrending,
}: HomeResponsiveContentProps) {
  const isDesktop = useIsDesktop();

  return (
    <>
      <div
        className="sticky top-14 z-10 border-b border-wibe/50 bg-wibe-surface/95 pb-1.5 pt-0.5 backdrop-blur-sm lg:hidden"
        aria-hidden={isDesktop || undefined}
      >
        <HomeSearchBar />
      </div>

      <HomePullToRefresh>
        <div className="lg:hidden" aria-hidden={isDesktop || undefined}>
          <HomeMobileView
            ssrFeaturedId={ssrFeaturedId}
            heroSpotlight={heroSpotlightMobile}
            initialCategories={initialCategories}
          />
        </div>
        <div className="hidden lg:block" aria-hidden={!isDesktop || undefined}>
          <HomeDesktopView
            ssrFeaturedId={ssrFeaturedId}
            initialCategories={initialCategories}
            heroSpotlight={heroSpotlightDesktop}
            desktopTrending={desktopTrending}
          />
        </div>
      </HomePullToRefresh>
    </>
  );
}
