import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CuratedLandingPageClient from '@/components/mobile/curated/CuratedLandingPageClient';

export const dynamic = 'force-dynamic';

export default function UserListsPage() {
  return (
    <div className="bg-wibe-surface">
      <Header title="اکسپلور" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <CuratedLandingPageClient />
      <BottomNav />
    </div>
  );
}
