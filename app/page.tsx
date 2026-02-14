import Header from '@/components/mobile/layout/Header';
import HomeSearchBar from '@/components/mobile/home/HomeSearchBar';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeHeroSpotlight from '@/components/mobile/home/HomeHeroSpotlight';
import TrendingThisWeekCarousel from '@/components/mobile/home/TrendingThisWeekCarousel';
import CategoryGridHome from '@/components/mobile/home/CategoryGridHome';
import ForYouSection from '@/components/mobile/home/ForYouSection';
import NewAndRisingSection from '@/components/mobile/home/NewAndRisingSection';
import CreatorSpotlightSection from '@/components/mobile/home/CreatorSpotlightSection';
import BottomCTASection from '@/components/mobile/home/BottomCTASection';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { HomeDataProvider } from '@/contexts/HomeDataContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export const revalidate = 60; // ISR

export const metadata = {
  title: 'خانه',
  description: 'کشف و اشتراک‌گذاری لیست‌های کیوریتد در حوزه لایف‌استایل - فیلم، کتاب، رستوران، سفر و بیشتر',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <Header />
      <main className="pt-2">
        <HomeDataProvider>
          <ErrorBoundary>
            <HomeSearchBar />
            <QuickCategoryChips />
            <div className="space-y-0">
              <HomeHeroSpotlight />
              <TrendingThisWeekCarousel />
              <ForYouSection />
              <NewAndRisingSection />
              <CategoryGridHome />
              <CreatorSpotlightSection />
              <BottomCTASection />
            </div>
          </ErrorBoundary>
        </HomeDataProvider>
      </main>
      <BottomNav />
    </div>
  );
}
