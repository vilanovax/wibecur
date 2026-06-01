import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CuratedLandingPageClient from '@/components/mobile/curated/CuratedLandingPageClient';

export const dynamic = 'force-dynamic';

export default function UserListsPage() {
  return (
    <div className="min-h-screen bg-wibe-surface pb-20 lg:pb-0">
      <Header title="اکسپلور" hideTitleOnDesktop showDesktopSearch={false} />
      <CuratedLandingPageClient />
      <BottomNav />
    </div>
  );
}
