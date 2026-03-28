'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import ExploreSmartHero from './ExploreSmartHero';
import TrendingRisingSection from './TrendingRisingSection';
import CategoryDiscoverySection from './CategoryDiscoverySection';
import CuratedGrid from './CuratedGrid';
import ExploreBottomCTA from './ExploreBottomCTA';
import { GridCardSkeleton } from './CuratedSkeletons';
import { mapTrendingToList } from '@/lib/curated/utils';
import type { CuratedList, CuratedCategory } from '@/types/curated';

export default function CuratedLandingPageClient() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const [trendingLists, setTrendingLists] = useState<CuratedList[]>([]);
  const [risingLists, setRisingLists] = useState<CuratedList[]>([]);
  const [featuredLists, setFeaturedLists] = useState<CuratedList[]>([]);
  const [categories, setCategories] = useState<CuratedCategory[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingRes, risingRes, popularRes, categoriesRes] = await Promise.all([
          fetch('/api/trending/global'),
          fetch('/api/trending/fast'),
          fetch('/api/trending/popular'),
          fetch('/api/categories'),
        ]);

        const [trendingJson, risingJson, popularJson, categoriesJson] = await Promise.all([
          trendingRes.json(),
          risingRes.json(),
          popularRes.json(),
          categoriesRes.json(),
        ]);

        const trendingMapped: CuratedList[] = trendingJson.success
          ? trendingJson.data.map(mapTrendingToList)
          : [];
        const trendingIds = new Set(trendingMapped.map((l: CuratedList) => l.id));

        const risingMapped: CuratedList[] = risingJson.success
          ? risingJson.data.map(mapTrendingToList).filter((l: CuratedList) => !trendingIds.has(l.id))
          : [];
        const shownIds = new Set([...trendingIds, ...risingMapped.map((l: CuratedList) => l.id)]);

        const featuredMapped: CuratedList[] = popularJson.success
          ? popularJson.data.map(mapTrendingToList).filter((l: CuratedList) => !shownIds.has(l.id))
          : [];

        setTrendingLists(trendingMapped);
        setRisingLists(risingMapped);
        setFeaturedLists(featuredMapped);
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
  const filteredFeatured = filterBySearch(featuredLists);

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
      />

      <main className="space-y-0">
        <TrendingRisingSection
          trendingLists={filteredTrending}
          risingLists={filteredRising}
        />
        <CategoryDiscoverySection categories={categories} />

        <ExploreBottomCTA onOpenCreate={() => setIsCreateFormOpen(true)} />

        {filteredFeatured.length > 0 ? (
          <section className="px-4 py-8" id="more">
            <h2 className="text-[18px] font-bold text-gray-900 mb-1">
              لیست‌های منتخب
            </h2>
            <p className="text-[13px] text-gray-500 mb-4">
              لیست‌های برگزیده توسط تیم وایب
            </p>
            <CuratedGrid lists={filteredFeatured} showSponsoredAfter={8} />
          </section>
        ) : searchQuery.trim() ? (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500">لیستی یافت نشد</p>
            <p className="text-sm text-gray-400 mt-1">
              فیلتر یا جستجو را تغییر دهید
            </p>
          </div>
        ) : null}
      </main>

      <CreateListForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
      />
    </div>
  );
}
