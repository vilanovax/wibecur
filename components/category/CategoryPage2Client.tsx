'use client';

import { useQuery } from '@tanstack/react-query';
import type { CategoryPageData, CategoryLayoutType } from '@/types/category-page';
import CategoryHero from './CategoryHero';
import TrendingListsSection from './TrendingListsSection';
import ViralSpotlightSection from './ViralSpotlightSection';
import TopCuratorsSection from './TopCuratorsSection';
import TopCuratorSpotlight from './TopCuratorSpotlight';
import NewListsSection from './NewListsSection';
import {
  HubHeroV2,
  HubCurators,
  HubNewLists,
  ExploreByCityPills,
  CafeWeeklyTrending,
  MostSavedItemsCafe,
  CafeCTABlock,
  SectionReveal,
} from './hub';
import {
  CinematicHero,
  GenreScrollBar,
  TrendingPosterGrid,
  FeaturedCinematicList,
  MostDebatedLists,
  NewListsCompact,
  CuratorCTABlock,
} from './film';
import { FILM_PAGE_SHELL } from './film/film-layout';

interface CategoryPage2ClientProps {
  slug: string;
  initialData?: CategoryPageData | null;
}

async function fetchCategoryPageData(slug: string): Promise<CategoryPageData> {
  const res = await fetch(`/api/categories/${slug}/page-data`);
  if (!res.ok) throw new Error('خطا در دریافت داده');
  const json = await res.json();
  return json.data;
}

export default function CategoryPage2Client({ slug, initialData = null }: CategoryPage2ClientProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['category-page', slug],
    queryFn: () => fetchCategoryPageData(slug),
    enabled: !!slug,
    initialData: initialData ?? undefined,
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading && !data) {
    const filmSlugs = ['movie', 'movies', 'film', 'film-serial'];
    const isFilmSkeleton = filmSlugs.includes(slug);

    return (
      <main className="min-h-[50vh] animate-pulse bg-wibe-surface">
        <div className={isFilmSkeleton ? FILM_PAGE_SHELL : 'px-4'}>
          <div
            className={
              isFilmSkeleton
                ? 'mt-3 aspect-[16/9] rounded-2xl bg-gray-200 lg:mt-5'
                : 'mt-4 h-44 rounded-lg bg-gray-200'
            }
          />
          <div className="mt-4 h-6 w-48 rounded bg-gray-200" />
          <div className="mt-4 flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 w-64 shrink-0 rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[40vh] px-4">
        <p className="wibe-body text-wibe-secondary">خطا در بارگذاری صفحه دسته</p>
      </main>
    );
  }

  const {
    category,
    metrics,
    trendingLists,
    topSavedThisWeek = [],
    viralSpotlight,
    topCurators,
    topCuratorSpotlight,
    newLists,
    popularAllTime = [],
    cityBreakdown = [],
  } = data;

  const filmSlugs = ['movie', 'movies', 'film'];
  const locationBasedSlugs = ['cafe'];
  const layoutType: CategoryLayoutType =
    (category.layoutType as CategoryLayoutType) ||
    (filmSlugs.includes(category.slug) ? 'cinematic' :
      locationBasedSlugs.includes(category.slug) ? 'locationBased' : 'minimal');
  const accentColor = category.accentColor || category.color;
  const isLocationBased = layoutType === 'locationBased';
  const isCinematic = layoutType === 'cinematic';

  if (isCinematic) {
    const trendingForGrid = trendingLists;
    const featuredList =
      viralSpotlight ??
      (trendingLists[1] && trendingLists[1].id !== trendingLists[0]?.id
        ? trendingLists[1]
        : null);
    const mostDebated = data.mostDebatedLists ?? [];

    return (
      <main className="bg-wibe-surface pb-2 lg:pb-4">
        <div className={FILM_PAGE_SHELL}>
          <CinematicHero category={category} metrics={metrics} />
          <GenreScrollBar categorySlug={category.slug} />
          <TrendingPosterGrid
            lists={trendingForGrid}
            categorySlug={category.slug}
          />
          {featuredList && <FeaturedCinematicList list={featuredList} />}
          {mostDebated.length > 0 && <MostDebatedLists lists={mostDebated} />}
          <NewListsCompact lists={newLists} categoryName={category.name} />
          <CuratorCTABlock categorySlug={category.slug} />
        </div>
      </main>
    );
  }

  if (isLocationBased) {
    const cityCounts = Object.fromEntries(
      cityBreakdown.map((c) => [c.city, c.listCount])
    );
    const mostSavedItems = data.mostSavedItems ?? [];

    return (
      <main className="scroll-smooth bg-wibe-surface">
        <HubHeroV2
          category={category}
          metrics={metrics}
          accentColor={accentColor}
        />

        <SectionReveal>
          <CafeWeeklyTrending
            lists={trendingLists}
            categoryName={category.name}
            accentColor={accentColor}
          />
        </SectionReveal>

        <SectionReveal>
          <ExploreByCityPills
            categorySlug={category.slug}
            cityCounts={cityCounts}
            accentColor={accentColor}
          />
        </SectionReveal>

        <SectionReveal>
          <HubCurators
            topCurator={topCuratorSpotlight ?? null}
            curators={topCurators}
            categoryName={category.name}
            accentColor={accentColor}
          />
        </SectionReveal>

        <SectionReveal>
          <HubNewLists
            lists={newLists}
            categoryName={category.name}
            accentColor={accentColor}
          />
        </SectionReveal>

        {mostSavedItems.length > 0 && (
          <SectionReveal>
            <MostSavedItemsCafe
              items={mostSavedItems}
              accentColor={accentColor}
            />
          </SectionReveal>
        )}

        <SectionReveal>
          <CafeCTABlock
            categorySlug={category.slug}
            accentColor={accentColor}
          />
        </SectionReveal>
      </main>
    );
  }

  return (
    <main className="bg-wibe-surface">
      <CategoryHero
        category={category}
        metrics={metrics}
        layoutType={layoutType}
      />

      <TrendingListsSection
        title={`داغ‌ترین لیست‌های هفته در ${category.name}`}
        subtitle="بر اساس ذخیره و engagement"
        lists={trendingLists}
        categoryName={category.name}
        accentColor={accentColor}
        improved={false}
      />

      {viralSpotlight && (
        <ViralSpotlightSection
          list={viralSpotlight}
          accentColor={accentColor}
        />
      )}

      <TopCuratorsSection
        curators={topCurators}
        categoryName={category.name}
      />

      <NewListsSection
        lists={newLists}
        categoryName={category.name}
      />
    </main>
  );
}
