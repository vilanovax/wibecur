'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import ExploreSmartHero from './ExploreSmartHero';
import GuidedDiscoverySheet from './GuidedDiscoverySheet';
import QuickNowSection from './QuickNowSection';
import RandomSurpriseCard from './RandomSurpriseCard';
import TrendingNowSection from './TrendingNowSection';
import ForYouSection from './ForYouSection';
import CategoryDiscoverySection from './CategoryDiscoverySection';
import ExploreBottomCTA from './ExploreBottomCTA';
import { ExplorePageSkeleton } from './ExplorePageSkeleton';
import SearchResultsPanel from '@/components/mobile/search/SearchResultsPanel';
import SearchResultSkeleton from '@/components/mobile/search/SearchResultSkeleton';
import { useUnifiedSearchQuery } from '@/lib/hooks/useUnifiedSearchQuery';
import { MOCK_CATEGORIES, getMockLists } from '@/lib/curated/mock-data';
import { buildExploreSections } from '@/lib/curated/explore-sections';
import type { ExplorePayload } from '@/lib/curated/explore-data';
import {
  moodCardToSelection,
  type MoodExplorerCard,
  type MoodExplorerSelection,
} from '@/lib/discovery/mood-explorer-config';
import { trackMoodExplorerClick } from '@/lib/analytics';

async function fetchExplore(): Promise<ExplorePayload> {
  const res = await fetch('/api/explore');
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'خطا در دریافت اکسپلور');
  return json.data as ExplorePayload;
}

export default function CuratedLandingPageClient({
  initialData,
}: {
  initialData?: ExplorePayload;
}) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const search = useUnifiedSearchQuery(searchQuery);
  const isSearchActive = search.isActive;
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [moodSelection, setMoodSelection] = useState<MoodExplorerSelection | null>(null);
  const [guidedOpen, setGuidedOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['explore'],
    queryFn: fetchExplore,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    initialData,
  });

  const usingMockFallback = isError;

  const allLists = useMemo(() => {
    if (data?.lists?.length) return data.lists;
    if (!isLoading) {
      const mockCats = MOCK_CATEGORIES.filter((c) => c.id !== 'all');
      return getMockLists().map((list) => {
        const cat = mockCats.find((c) => c.id === list.categoryId);
        if (!cat) return list;
        return {
          ...list,
          category: { name: cat.title, icon: cat.icon, slug: cat.slug ?? null },
        };
      });
    }
    return [];
  }, [data?.lists, isLoading]);

  const categories = useMemo(() => {
    if (data?.categories?.length) return data.categories;
    return MOCK_CATEGORIES;
  }, [data?.categories]);

  const activeCategoryIds = useMemo(
    () => categories.filter((c) => c.id !== 'all').map((c) => c.id),
    [categories]
  );

  const sections = useMemo(
    () =>
      buildExploreSections(allLists, '', {
        preferredCategoryIds: usingMockFallback ? undefined : data?.preferredCategoryIds,
        activeCategoryIds,
        excludeListIds: usingMockFallback ? undefined : data?.bookmarkedListIds,
      }),
    [
      allLists,
      data?.preferredCategoryIds,
      data?.bookmarkedListIds,
      usingMockFallback,
      activeCategoryIds,
    ]
  );

  const openMoodSelection = useCallback((selection: MoodExplorerSelection, source: 'card' | 'quick_now') => {
    trackMoodExplorerClick(selection.moodId, source);
    setMoodSelection(selection);
    setGuidedOpen(true);
  }, []);

  const handleMoodCardSelect = useCallback(
    (card: MoodExplorerCard) => {
      openMoodSelection(moodCardToSelection(card), 'card');
    },
    [openMoodSelection]
  );

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('openCreate') === '1') {
      setIsCreateFormOpen(true);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/user-lists');
      }
    }
  }, [searchParams]);

  if (isLoading) {
    return <ExplorePageSkeleton />;
  }

  const showDiscovery = !isSearchActive;

  return (
    <div className="bg-wibe-surface">
      <ExploreSmartHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMoodSelect={showDiscovery ? handleMoodCardSelect : undefined}
        showMoodExplorer={showDiscovery}
      />

      <main className="space-y-0">
        {isSearchActive ? (
          <div className="px-2.5 py-4 lg:px-0 lg:py-5">
            {search.loading && !search.hasResults ? (
              <SearchResultSkeleton rows={5} />
            ) : !search.loading &&
              !search.hasResults &&
              !(search.viewTab === 'lists' && search.loadingMore) ? (
              <div className="py-10 text-center">
                <p className="wibe-body font-medium text-foreground">نتیجه‌ای پیدا نشد</p>
                <p className="mt-1 wibe-caption text-wibe-secondary">
                  عبارت دیگری امتحان کن یا از کلمات کلیدی ژانر استفاده کن
                </p>
              </div>
            ) : (
              <SearchResultsPanel
                query={search.normalized}
                queryIntent={search.queryIntent}
                directItems={search.directItems}
                indirectItems={search.indirectItems}
                topPicks={search.topPicks}
                subThemes={search.subThemes}
                similarItems={search.similarItems}
                lists={search.lists}
                totals={search.totals}
                hasMore={search.hasMore}
                viewTab={search.viewTab}
                onTabChange={search.setViewTab}
                onSubThemeClick={setSearchQuery}
                loadingMore={search.viewTab === 'lists' && search.loadingMore}
                highlightQuery={search.normalized}
              />
            )}
          </div>
        ) : (
          <>
            <QuickNowSection onSelect={(s) => openMoodSelection(s, 'quick_now')} />
            <RandomSurpriseCard lists={sections.trending} />
            {sections.trending.length > 0 && (
              <TrendingNowSection lists={sections.trending} subtitle="محبوب‌ترین‌ها همین الان" />
            )}
            <CategoryDiscoverySection categories={categories} />
            {sections.forYou.length > 0 && (
              <ForYouSection lists={sections.forYou} personalized={sections.isPersonalized} />
            )}

            {sections.filtered.length === 0 && (
              <div className="px-2.5 py-12 text-center">
                <p className="wibe-body text-wibe-secondary">لیستی یافت نشد</p>
                <p className="mt-2 wibe-caption text-wibe-secondary/80">
                  اولین لیستت را بساز یا در صفحهٔ لیست‌ها جستجو کن
                </p>
                <Link
                  href="/lists"
                  className="mt-4 inline-block rounded-xl bg-primary px-4 py-2.5 wibe-small font-semibold text-white"
                >
                  رفتن به لیست‌ها
                </Link>
              </div>
            )}
          </>
        )}

        {showDiscovery && <ExploreBottomCTA onOpenCreate={() => setIsCreateFormOpen(true)} />}
      </main>

      <CreateListForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
      />

      <GuidedDiscoverySheet
        selection={moodSelection}
        isOpen={guidedOpen}
        onClose={() => {
          setGuidedOpen(false);
          setMoodSelection(null);
        }}
      />
    </div>
  );
}
