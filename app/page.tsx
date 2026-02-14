import Header from '@/components/mobile/layout/Header';
import HeroGreeting from '@/components/mobile/home/HeroGreeting';
import EnhancedSearch from '@/components/mobile/home/EnhancedSearch';
import HomeFeedTabs from '@/components/mobile/home/HomeFeedTabs';
import FeaturedCard from '@/components/mobile/home/FeaturedCard';
import RecommendationSection from '@/components/mobile/recommendations/RecommendationSection';
import CategoryScroll from '@/components/mobile/home/CategoryScroll';
import GlobalTrendingSection from '@/components/mobile/home/GlobalTrendingSection';
import CreatorSpotlightSection from '@/components/mobile/home/CreatorSpotlightSection';
import TrendingLists from '@/components/mobile/home/TrendingLists';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { HomeDataProvider } from '@/contexts/HomeDataContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export const metadata = {
  title: 'خانه',
  description: 'کشف و اشتراک‌گذاری لیست‌های کیوریتد در حوزه لایف‌استایل - فیلم، کتاب، رستوران، سفر و بیشتر',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <Header />
      <HeroGreeting />
      <EnhancedSearch />
      <main className="space-y-0 px-0">
        <HomeDataProvider>
          <ErrorBoundary>
            <HomeFeedTabs>
              <>
                <FeaturedCard />
                <GlobalTrendingSection />
                <CreatorSpotlightSection />
                <RecommendationSection />
                <CategoryScroll />
                <TrendingLists />
              </>
            </HomeFeedTabs>
          </ErrorBoundary>
        </HomeDataProvider>
      </main>
      <BottomNav />
    </div>
  );
}
