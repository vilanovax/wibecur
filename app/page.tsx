import Header from '@/components/mobile/layout/Header';
import HomeSearchBar from '@/components/mobile/home/HomeSearchBar';
import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import HomeHeroSpotlight from '@/components/mobile/home/HomeHeroSpotlight';
import TrendingThisWeekCarousel from '@/components/mobile/home/TrendingThisWeekCarousel';
import NewAndRisingSection from '@/components/mobile/home/NewAndRisingSection';
import CategoryGridHome from '@/components/mobile/home/CategoryGridHome';
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
            <div className="sticky top-14 z-10 bg-gray-50 pb-1 -mt-2 pt-2">
              <HomeSearchBar />
              <QuickCategoryChips />
            </div>

            <div className="space-y-0">
              <HomeHeroSpotlight />
              <TrendingThisWeekCarousel />
              <CategoryGridHome />
              <NewAndRisingSection />
            </div>
          </ErrorBoundary>
        </HomeDataProvider>
      </main>
      <BottomNav />
    </div>
  );
}
