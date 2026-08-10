'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
 * موبایل: جستجو sticky است ولی با اسکرول پایین جمع می‌شود تا کروم ثابت
 * (هدر + سرچ + bottom nav) فضای فید را نخورد.
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
  const [searchCollapsed, setSearchCollapsed] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setSearchCollapsed(false);
      return;
    }

    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (y < 48) {
          setSearchCollapsed(false);
        } else if (delta > 6) {
          setSearchCollapsed(true);
        } else if (delta < -6) {
          setSearchCollapsed(false);
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isDesktop]);

  return (
    <>
      <div
        className={`sticky top-14 z-10 overflow-hidden border-b bg-wibe-surface/95 backdrop-blur-sm transition-[max-height,opacity,border-color] duration-200 ease-out lg:hidden ${
          searchCollapsed
            ? 'pointer-events-none max-h-0 border-transparent opacity-0'
            : 'max-h-20 border-wibe/50 opacity-100 pb-1.5 pt-0.5'
        }`}
        aria-hidden={isDesktop || searchCollapsed || undefined}
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
