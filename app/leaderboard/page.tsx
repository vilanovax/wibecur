import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import LeaderboardClient from './LeaderboardClient';
import {
  fetchLeaderboard,
  fetchLeaderboardCategories,
  type LeaderboardRow,
  type LeaderboardCategoryOption,
} from '@/lib/leaderboard';

export const revalidate = 300;

export const metadata = {
  title: 'رتبه‌بندی کریتورها | وایب',
  description: 'تاثیرگذارترین کیوریتورهای وایب',
};

export default async function LeaderboardPage() {
  let initialList: LeaderboardRow[] = [];
  let initialCategories: LeaderboardCategoryOption[] = [];

  try {
    const [list, categories] = await Promise.all([
      fetchLeaderboard('global'),
      fetchLeaderboardCategories(),
    ]);
    initialList = list;
    initialCategories = categories;
  } catch (err) {
    console.warn('Leaderboard SSR fetch failed:', err);
  }

  return (
    <div className="min-h-screen bg-wibe-surface pb-20">
      <Header title="رتبه‌بندی" showBack />
      <LeaderboardClient
        initialList={JSON.parse(JSON.stringify(initialList))}
        initialCategories={JSON.parse(JSON.stringify(initialCategories))}
      />
      <BottomNav />
    </div>
  );
}
