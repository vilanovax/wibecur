import Header from '@/components/mobile/layout/Header';
import HeroGreeting from '@/components/mobile/home/HeroGreeting';
import EnhancedSearch from '@/components/mobile/home/EnhancedSearch';
import FeaturedCard from '@/components/mobile/home/FeaturedCard';
import RecommendationSection from '@/components/mobile/recommendations/RecommendationSection';
import CategoryScroll from '@/components/mobile/home/CategoryScroll';
import TrendingLists from '@/components/mobile/home/TrendingLists';
import BottomNav from '@/components/mobile/layout/BottomNav';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <Header />
      <HeroGreeting />
      <EnhancedSearch />
      <main className="space-y-6 px-0">
        <FeaturedCard />
        <RecommendationSection />
        <CategoryScroll />
        <TrendingLists />
      </main>
      <BottomNav />
    </div>
  );
}
