'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import ExploreSmartHero from './ExploreSmartHero';
import GuidedDiscoverySheet from './GuidedDiscoverySheet';
import type { GuidedScenario } from '@/lib/discovery/guided-intent';
import TrendingNowSection from './TrendingNowSection';
import RisingListsSection from './RisingListsSection';
import ForYouSection from './ForYouSection';
import CategoryDiscoverySection from './CategoryDiscoverySection';
import CuratedGrid from './CuratedGrid';
import ExploreBottomCTA from './ExploreBottomCTA';
import ExploreSectionTitle from './ExploreSectionTitle';
import { ExplorePageSkeleton } from './ExplorePageSkeleton';
import SearchResultsPanel from '@/components/mobile/search/SearchResultsPanel';
import SearchResultSkeleton from '@/components/mobile/search/SearchResultSkeleton';
import { useUnifiedSearchQuery } from '@/lib/hooks/useUnifiedSearchQuery';
import { MOCK_CATEGORIES, getMockLists } from '@/lib/curated/mock-data';
import { buildExploreSections } from '@/lib/curated/explore-sections';
import type { ExplorePayload } from '@/lib/curated/explore-data';

const SECTION_IDS: Record<string, string> = {
  trending: 'trending',
  foryou: 'foryou',
  rising: 'rising',
  categories: 'categories',
  more: 'more',
};

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
  const [guidedScenario, setGuidedScenario] = useState<GuidedScenario | null>(null);
  const [guidedOpen, setGuidedOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['explore'],
    queryFn: fetchExplore,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    // داده‌ی SSR — از first paint بدون skeleton و بدون round-trip اضافه استفاده می‌شود
    initialData,
  });

  /** فقط در خطای API — خالی بودن دادهٔ واقعی نباید mock با دستهٔ کتاب نشان دهد */
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

  const handleGuidedScenarioSelect = useCallback((scenario: GuidedScenario) => {
    setGuidedScenario(scenario);
    setGuidedOpen(true);
  }, []);

  const handleModeScroll = useCallback((id: string) => {
    const sectionId = SECTION_IDS[id] ?? id;
    const el = document.getElementById(sectionId);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, []);

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
        onModeScroll={handleModeScroll}
        onGuidedScenarioSelect={showDiscovery ? handleGuidedScenarioSelect : undefined}
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
            <CategoryDiscoverySection categories={categories} />
            {sections.trending.length > 0 && <TrendingNowSection lists={sections.trending} />}
            {sections.forYou.length > 0 && (
              <ForYouSection lists={sections.forYou} personalized={sections.isPersonalized} />
            )}
            {sections.rising.length > 0 && <RisingListsSection lists={sections.rising} />}

            {sections.more.length > 0 && (
              <section className="border-t border-wibe/60 px-2.5 py-4 lg:px-0 lg:py-5" id="more">
                <ExploreSectionTitle
                  title="بیشتر ببین"
                  subtitle="لیست‌های کیوریت‌شده"
                  icon="✨"
                />
                <CuratedGrid lists={sections.more} showSponsoredAfter={99} />
                {sections.moreTotal > sections.more.length && (
                  <Link
                    href="/lists"
                    className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-wibe bg-wibe-card py-2.5 wibe-small font-semibold text-primary transition-colors active:scale-[0.99] lg:mx-auto lg:max-w-sm lg:hover:bg-primary/5"
                  >
                    مشاهده همه ({sections.moreTotal.toLocaleString('fa-IR')} لیست)
                    <ChevronLeft className="h-4 w-4 rotate-180" aria-hidden />
                  </Link>
                )}
              </section>
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
        scenario={guidedScenario}
        isOpen={guidedOpen}
        onClose={() => {
          setGuidedOpen(false);
          setGuidedScenario(null);
        }}
      />
    </div>
  );
}
