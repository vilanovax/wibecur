'use client';

import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import ExploreSmartHero from './ExploreSmartHero';
import QuickNowSection from './QuickNowSection';
import { ExplorePageSkeleton } from './ExplorePageSkeleton';
import SearchResultSkeleton from '@/components/mobile/search/SearchResultSkeleton';
import HomeDeferredMount from '@/components/mobile/home/HomeDeferredMount';
import {
  CreateListFormLazy,
  GuidedDiscoverySheetLazy,
  SearchResultsPanelLazy,
  RandomSurpriseCardLazy,
  TrendingNowSectionLazy,
  CategoryDiscoverySectionLazy,
  ForYouSectionLazy,
} from './explore-lazy-sections';
import {
  ExploreCategorySectionSkeleton,
  ExploreForYouSectionSkeleton,
  ExploreSurpriseSectionSkeleton,
  ExploreTrendingSectionSkeleton,
} from './explore-section-skeletons';
import { useUnifiedSearchQuery } from '@/lib/hooks/useUnifiedSearchQuery';
import { SEARCH_MIN_LENGTH } from '@/lib/list-search';
import { MOCK_CATEGORIES, getMockLists } from '@/lib/curated/mock-data';
import { buildExploreSections } from '@/lib/curated/explore-sections';
import type { ExplorePayload, ExploreUserPreferences } from '@/lib/curated/explore-data';
import {
  moodCardToSelection,
  type MoodExplorerCard,
  type MoodExplorerSelection,
} from '@/lib/discovery/mood-explorer-config';
import { trackMoodExplorerClick } from '@/lib/analytics';
import { useLazyInView } from '@/hooks/useLazyInView';

async function fetchExploreBase(): Promise<ExplorePayload> {
  const res = await fetch('/api/explore/base');
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'خطا در دریافت اکسپلور');
  return json.data as ExplorePayload;
}

async function fetchExplorePreferences(): Promise<ExploreUserPreferences> {
  const res = await fetch('/api/explore/preferences');
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'خطا در دریافت ترجیحات');
  return json.data as ExploreUserPreferences;
}

export default function CuratedLandingPageClient({
  initialData,
  trendingSlot,
  categoriesSlot,
}: {
  initialData?: ExplorePayload;
  trendingSlot?: ReactNode;
  categoriesSlot?: ReactNode;
}) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const searchEnabled = searchQuery.trim().length >= SEARCH_MIN_LENGTH;
  const search = useUnifiedSearchQuery(searchQuery, { enabled: searchEnabled });
  const isSearchActive = search.isActive;
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [moodSelection, setMoodSelection] = useState<MoodExplorerSelection | null>(null);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const { ref: forYouRef, inView: forYouInView } = useLazyInView<HTMLDivElement>({
    rootMargin: '320px',
    once: true,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['explore-base'],
    queryFn: fetchExploreBase,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    initialData,
  });

  const isLoggedIn = Boolean(session?.user?.id);
  const { data: userPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['explore-preferences'],
    queryFn: fetchExplorePreferences,
    enabled: isLoggedIn && forYouInView,
    staleTime: 5 * 60 * 1000,
    retry: 1,
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
        preferredKeywordIds: usingMockFallback ? undefined : userPrefs?.preferredKeywordIds,
        preferredCategoryIds: usingMockFallback ? undefined : userPrefs?.preferredCategoryIds,
        activeCategoryIds,
        excludeListIds: usingMockFallback ? undefined : userPrefs?.bookmarkedListIds,
      }),
    [
      allLists,
      userPrefs?.preferredKeywordIds,
      userPrefs?.preferredCategoryIds,
      userPrefs?.bookmarkedListIds,
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
  const showPersonalizedForYou = isLoggedIn && Boolean(userPrefs);
  const forYouPending = isLoggedIn && forYouInView && prefsLoading && !userPrefs;

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
              <SearchResultsPanelLazy
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
            <div className="hidden lg:block">
              <QuickNowSection onSelect={(s) => openMoodSelection(s, 'quick_now')} />
            </div>

            <HomeDeferredMount fallback={<ExploreSurpriseSectionSkeleton />}>
              <RandomSurpriseCardLazy lists={sections.trending} />
            </HomeDeferredMount>

            {trendingSlot ??
              (sections.trending.length > 0 ? (
                <HomeDeferredMount fallback={<ExploreTrendingSectionSkeleton />}>
                  <TrendingNowSectionLazy
                    lists={sections.trending}
                    subtitle="محبوب‌ترین‌ها همین الان"
                  />
                </HomeDeferredMount>
              ) : null)}

            {categoriesSlot ?? (
              <HomeDeferredMount fallback={<ExploreCategorySectionSkeleton />}>
                <CategoryDiscoverySectionLazy categories={categories} />
              </HomeDeferredMount>
            )}

            <div ref={forYouRef} className="min-h-[1px]">
              {forYouPending || !forYouInView ? (
                <ExploreForYouSectionSkeleton />
              ) : sections.forYou.length > 0 ? (
                <ForYouSectionLazy
                  lists={sections.forYou}
                  personalized={showPersonalizedForYou && sections.isPersonalized}
                  diverseCategories={sections.diverseCategories}
                />
              ) : null}
            </div>

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
      </main>

      {isCreateFormOpen && (
        <CreateListFormLazy
          isOpen={isCreateFormOpen}
          onClose={() => setIsCreateFormOpen(false)}
        />
      )}

      {guidedOpen && (
        <GuidedDiscoverySheetLazy
          selection={moodSelection}
          isOpen={guidedOpen}
          onClose={() => {
            setGuidedOpen(false);
            setMoodSelection(null);
          }}
        />
      )}
    </div>
  );
}
