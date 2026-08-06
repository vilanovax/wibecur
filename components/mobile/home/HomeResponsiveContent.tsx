'use client';

import type { ReactNode } from 'react';
import HomeSearchBar from '@/components/mobile/home/HomeSearchBar';
import HomePullToRefresh from '@/components/mobile/home/HomePullToRefresh';
import HomeMobileView from '@/components/mobile/home/HomeMobileView';
import HomeDesktopView from '@/components/mobile/home/HomeDesktopView';
import type { CategoryMenuChip } from '@/lib/category-menu';

/**
 * هر دو چیدمان با CSS (`lg:`) رندر می‌شوند — نه با useIsDesktop.
 * HomeDesktopView را static نگه می‌داریم: dynamic+loading اسکلتون کوتاه
 * می‌کشید و با جایگزینی محتوای واقعی CLS≈0.6 روی دسکتاپ می‌ساخت.
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
  return (
    <>
      <div className="sticky top-14 z-10 border-b border-wibe/50 bg-wibe-surface/95 pb-1.5 pt-0.5 backdrop-blur-sm lg:hidden">
        <HomeSearchBar />
      </div>

      <HomePullToRefresh>
        <div className="lg:hidden">
          <HomeMobileView
            ssrFeaturedId={ssrFeaturedId}
            heroSpotlight={heroSpotlightMobile}
            initialCategories={initialCategories}
          />
        </div>
        <div className="hidden lg:block">
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
