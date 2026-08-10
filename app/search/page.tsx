import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import SearchPageClient from './SearchPageClient';
import { fetchSearchPageSeed } from '@/lib/search-ssr';
import { normalizeSearchQuery } from '@/lib/list-search';

export const metadata = {
  // layout template already appends `| WibeCur`
  title: 'جستجو',
  description: 'جستجو در آیتم‌ها و لیست‌های WibeCur',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = normalizeSearchQuery(params.q ?? '');
  const initialSearch = await fetchSearchPageSeed(initialQuery);

  return (
    <div className="flex flex-col lg:bg-transparent">
      <Header title="جستجو" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <main className="min-w-0 flex-1 lg:pt-0">
        <SearchPageClient
          initialQuery={initialQuery}
          initialSearch={initialSearch}
        />
      </main>
      <BottomNav />
    </div>
  );
}
