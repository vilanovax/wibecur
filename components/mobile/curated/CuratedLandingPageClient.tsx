'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import ExploreSmartHero from './ExploreSmartHero';
import TrendingNowSection from './TrendingNowSection';
import RisingListsSection from './RisingListsSection';
import CategoryDiscoverySection from './CategoryDiscoverySection';
import CuratedGrid from './CuratedGrid';
import ExploreBottomCTA from './ExploreBottomCTA';
import { GridCardSkeleton } from './CuratedSkeletons';
import { mapTrendingToList } from '@/lib/curated/utils';
import type { CuratedList, CuratedCategory } from '@/types/curated';

const SECTION_IDS: Record<string, string> = {
  trending: 'trending',
  rising: 'rising',
  categories: 'categories',
};

export default function CuratedLandingPageClient() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const [trendingLists, setTrendingLists] = useState<CuratedList[]>([]);
  const [risingLists, setRisingLists] = useState<CuratedList[]>([]);
  const [categories, setCategories] = useState<CuratedCategory[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingRes, risingRes, categoriesRes] = await Promise.all([
          fetch('/api/trending/global'),
          fetch('/api/trending/fast'),
          fetch('/api/categories'),
        ]);

        const [trendingJson, risingJson, categoriesJson] = await Promise.all([
          trendingRes.json(),
          risingRes.json(),
          categoriesRes.json(),
        ]);

        if (trendingJson.success) {
          setTrendingLists(trendingJson.data.map(mapTrendingToList));
        }
        if (risingJson.success) {
          setRisingLists(risingJson.data.map(mapTrendingToList));
        }
        if (categoriesJson.success) {
          setCategories(
            categoriesJson.data.map((c: { id: string; name: string; slug: string; icon: string | null }) => ({
              id: c.id,
              slug: c.slug,
              title: c.name,
              icon: c.icon ?? '📋',
            }))
          );
        }
      } catch (err) {
        console.error('Explore fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleModeScroll = useCallback((id: string) => {
    const sectionId = SECTION_IDS[id] ?? id;
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (searchParams.get('openCreate') === '1') {
      setIsCreateFormOpen(true);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/user-lists');
      }
    }
  }, [searchParams]);

  // Client-side search filter
  const filterBySearch = (lists: CuratedList[]) => {
    if (!searchQuery.trim()) return lists;
    const q = searchQuery.toLowerCase();
    return lists.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.creator.name.toLowerCase().includes(q) ||
        (l.subtitle && l.subtitle.toLowerCase().includes(q))
    );
  };

  const filteredTrending = filterBySearch(trendingLists);
  const filteredRising = filterBySearch(risingLists);
  const allFiltered = filterBySearch(
    [...trendingLists, ...risingLists].filter(
      (list, index, self) => self.findIndex((l) => l.id === list.id) === index
    )
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="h-[160px] bg-white border-b animate-pulse" />
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
        <TrendingNowSection lists={filteredTrending} />
        <RisingListsSection lists={filteredRising} />
        <CategoryDiscoverySection categories={categories} />

        {allFiltered.length > 0 ? (
          <section className="px-4 py-8" id="more">
            <h2 className="text-[18px] font-bold text-gray-900 mb-1">
              لیست‌های منتخب
            </h2>
            <p className="text-[13px] text-gray-500 mb-4">
              لیست‌های برگزیده توسط تیم وایب
            </p>
            <CuratedGrid lists={allFiltered} showSponsoredAfter={8} />
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

      <CreateListForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
      />
    </div>
  );
}
