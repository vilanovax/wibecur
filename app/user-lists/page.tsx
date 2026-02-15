import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CuratedLandingPageClient from '@/components/mobile/curated/CuratedLandingPageClient';

export const dynamic = 'force-dynamic';

export default function UserListsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="اکسپلور" />
      <CuratedLandingPageClient />
      <BottomNav />
    </div>
  );
}
