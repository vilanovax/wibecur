'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import FloatingActionButton from '@/components/mobile/lists/FloatingActionButton';
import ExploreSmartHero from './ExploreSmartHero';
import TrendingNowSection from './TrendingNowSection';
import RisingListsSection from './RisingListsSection';
import ForYouSection from './ForYouSection';
import EliteCuratorsSection from './EliteCuratorsSection';
import RisingCuratorsSection from './RisingCuratorsSection';
import CategoryDiscoverySection from './CategoryDiscoverySection';
import CuratedGrid from './CuratedGrid';
import ExploreBottomCTA from './ExploreBottomCTA';
import {
  HeroSkeleton,
  CuratorsRowSkeleton,
  GridCardSkeleton,
} from './CuratedSkeletons';
import {
  MOCK_CATEGORIES,
  MOCK_CURATORS,
  getMockLists,
} from '@/lib/curated/mock-data';
import { filterAndSortLists } from '@/lib/curated/utils';

const SECTION_IDS: Record<string, string> = {
  trending: 'trending',
  foryou: 'foryou',
  elite: 'elite',
  rising: 'rising-curators',
  categories: 'categories',
};

export default function CuratedLandingPageClient() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const lists = useMemo(() => getMockLists(), []);
  const curators = MOCK_CURATORS;
  const categories = MOCK_CATEGORIES.filter((c) => c.id !== 'all');

  const filteredLists = useMemo(
    () =>
      filterAndSortLists(lists, {
        mode: 'trending',
        categoryId: 'all',
        searchQuery,
      }),
    [lists, searchQuery]
  );

  const handleModeScroll = useCallback((id: string) => {
    const sectionId = SECTION_IDS[id] ?? id;
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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
        <div className="h-[160px] bg-white border-b animate-pulse" />
        <CuratorsRowSkeleton />
        <div className="px-4 py-8">
          <div className="h-5 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <GridCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ExploreSmartHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onModeScroll={handleModeScroll}
      />

      <main className="space-y-0">
        <TrendingNowSection lists={filteredLists} />
        <RisingListsSection lists={filteredLists} />
        <ForYouSection lists={filteredLists} />
        <EliteCuratorsSection curators={curators} />
        <RisingCuratorsSection curators={curators} />
        <CategoryDiscoverySection categories={MOCK_CATEGORIES} />

        {filteredLists.length > 0 ? (
          <section className="px-4 py-8" id="more">
            <h2 className="text-[18px] font-bold text-gray-900 mb-3">
              بیشتر ببین
            </h2>
            <p className="text-[13px] text-gray-500 mb-4">
              لیست‌های کیوریت شده بر اساس ترند
            </p>
            <CuratedGrid lists={filteredLists} showSponsoredAfter={8} />
          </section>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500">لیستی یافت نشد</p>
            <p className="text-sm text-gray-400 mt-1">
              فیلتر یا جستجو را تغییر دهید
            </p>
          </div>
        )}

        <ExploreBottomCTA onOpenCreate={() => setIsCreateFormOpen(true)} />
      </main>

      <FloatingActionButton onClick={() => setIsCreateFormOpen(true)} />
      <CreateListForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
      />
    </div>
  );
}
