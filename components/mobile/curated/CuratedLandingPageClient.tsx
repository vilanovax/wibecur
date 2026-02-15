'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import FloatingActionButton from '@/components/mobile/lists/FloatingActionButton';
import CuratedHero from './CuratedHero';
import ModeTabsSticky from './ModeTabsSticky';
import CategoryChips from './CategoryChips';
import TopCuratorsRow from './TopCuratorsRow';
import CuratedGrid from './CuratedGrid';
import RisingCreatorsRow from './RisingCreatorsRow';
import { HeroSkeleton, CuratorsRowSkeleton, GridCardSkeleton } from './CuratedSkeletons';
import {
  MOCK_CATEGORIES,
  MOCK_CURATORS,
  getMockLists,
} from '@/lib/curated/mock-data';
import { filterAndSortLists } from '@/lib/curated/utils';
import type { CuratedMode } from '@/types/curated';

const VALID_TABS: CuratedMode[] = [
  'trending',
  'popular',
  'new',
  'top_curators',
  'rising',
];

function parseTab(tab: string | null): CuratedMode {
  if (tab && VALID_TABS.includes(tab as CuratedMode)) {
    return tab as CuratedMode;
  }
  return 'trending';
}

export default function CuratedLandingPageClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [mode, setMode] = useState<CuratedMode>(() => parseTab(tabParam));
  const [categoryId, setCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const lists = useMemo(() => getMockLists(), []);
  const curators = MOCK_CURATORS;
  const categories = MOCK_CATEGORIES;

  const filteredLists = useMemo(
    () =>
      filterAndSortLists(lists, {
        mode,
        categoryId,
        searchQuery,
      }),
    [lists, mode, categoryId, searchQuery]
  );

  const showCurators =
    mode === 'trending' || mode === 'popular' || mode === 'top_curators';
  const showRising = mode === 'trending' || mode === 'rising';

  useEffect(() => {
    const t = parseTab(tabParam);
    setMode(t);
  }, [tabParam]);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (searchParams.get('openCreate') === '1') {
      setIsCreateFormOpen(true);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/user-lists');
      }
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <HeroSkeleton />
        <div className="h-14 bg-white border-b animate-pulse" />
        <CuratorsRowSkeleton />
        <div className="px-4 py-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <GridCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CuratedHero />
      <div className="px-4 py-2">
        <input
          type="search"
          placeholder="جستجو در لیست‌ها..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          aria-label="جستجو در لیست‌ها"
        />
      </div>
      <ModeTabsSticky value={mode} onChange={setMode} />
      <CategoryChips
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        count={filteredLists.length}
      />
      {showCurators && <TopCuratorsRow curators={curators} />}
      {showRising && <RisingCreatorsRow curators={curators} />}
      {mode === 'top_curators' ? (
        <div className="px-4 py-8 text-center text-gray-500">
          <p>صفحه کیوریتورهای برتر — به زودی</p>
          <p className="text-sm mt-2">در حال حاضر لیست‌های آن‌ها را ببینید</p>
        </div>
      ) : filteredLists.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">لیستی یافت نشد</p>
          <p className="text-sm text-gray-400 mt-1">
            فیلتر یا جستجو را تغییر دهید
          </p>
        </div>
      ) : (
        <CuratedGrid lists={filteredLists} showSponsoredAfter={8} />
      )}
      <FloatingActionButton onClick={() => setIsCreateFormOpen(true)} />
      <CreateListForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
      />
    </div>
  );
}
