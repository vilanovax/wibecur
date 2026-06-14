'use client';

import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeHeroSpotlight from '@/components/mobile/home/HomeHeroSpotlight';
import TrendingThisWeekCarousel from '@/components/mobile/home/TrendingThisWeekCarousel';
import ForYouSection from '@/components/mobile/home/ForYouSection';
import NewAndRisingSection from '@/components/mobile/home/NewAndRisingSection';
import CreatorSpotlightSection from '@/components/mobile/home/CreatorSpotlightSection';

/**
 * چیدمان دسکتاپ — Magazine / Editorial
 * همه سکشن‌ها همزمان visible (بدون tab و بدون sidebar)
 */
export default function HomeDesktopView() {
  return (
    <div className="hidden lg:flex lg:flex-col lg:gap-8 xl:gap-10">
      <QuickCategoryChips />

      <HomeHeroSpotlight />

      <div className="flex flex-col gap-8 xl:gap-10">
        <TrendingThisWeekCarousel />
        <ForYouSection />
        <NewAndRisingSection />
      </div>

      <CreatorSpotlightSection />
    </div>
  );
}
