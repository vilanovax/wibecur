import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'رتبه‌بندی کریتورها | وایب',
  description: 'تاثیرگذارترین کیوریتورهای وایب',
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="رتبه‌بندی" showBack />
      <LeaderboardClient />
      <BottomNav />
    </div>
  );
}
