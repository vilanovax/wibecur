import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import SearchPageClient from './SearchPageClient';

export const metadata = {
  title: 'جستجو | WibeCur',
  description: 'جستجو در آیتم‌ها و لیست‌های WibeCur',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col lg:bg-transparent">
      <Header title="جستجو" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <main className="min-w-0 flex-1 lg:pt-0">
        <SearchPageClient initialQuery={params.q ?? ''} />
      </main>
      <BottomNav />
    </div>
  );
}
