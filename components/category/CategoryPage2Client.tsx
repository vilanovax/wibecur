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
  TopFilmCuratorsVIP,
  MostDebatedLists,
  NewListsCompact,
  CuratorCTABlock,
} from './film';

interface CategoryPage2ClientProps {
  slug: string;
}

async function fetchCategoryPageData(slug: string): Promise<CategoryPageData> {
  const res = await fetch(`/api/categories/${slug}/page-data`);
  if (!res.ok) throw new Error('خطا در دریافت داده');
  const json = await res.json();
  return json.data;
}

export default function CategoryPage2Client({ slug }: CategoryPage2ClientProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['category-page', slug],
    queryFn: () => fetchCategoryPageData(slug),
    enabled: !!slug,
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <main className="min-h-[50vh] space-y-6 animate-pulse">
        <div className="mx-4 mt-4 h-44 rounded-2xl bg-gray-200" />
        <div className="mx-4 h-6 w-48 rounded bg-gray-200" />
        <div className="mx-4 flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-64 flex-shrink-0 rounded-2xl bg-gray-200" />
          ))}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[40vh] px-4">
        <p className="text-gray-500">خطا در بارگذاری صفحه دسته</p>
      </main>
    );
  }

  const {
    category,
    metrics,
    trendingLists,
    trendingNow24h = [],
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

  if (isLocationBased) {
    const cityCounts = Object.fromEntries(
      cityBreakdown.map((c) => [c.city, c.listCount])
    );
    const mostSavedItems = data.mostSavedItems ?? [];

    return (
      <main className="min-h-screen pb-24 bg-gray-50 scroll-smooth">
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

  const genreBarSlugs = ['movie', 'movies', 'film', 'film-serial', 'book', 'books'];
  const showGenreBar = genreBarSlugs.includes(category.slug);

  return (
    <main className="min-h-screen pb-24">
      <CategoryHero
        category={category}
        metrics={metrics}
        layoutType={layoutType}
      />

      {showGenreBar && <GenreScrollBar categorySlug={category.slug} />}

      <TrendingListsSection
        title={`داغ‌ترین لیست‌های هفته در ${category.name}`}
        subtitle="بر اساس ذخیره و engagement"
        lists={trendingLists}
        categoryName={category.name}
        accentColor={accentColor}
        improved={false}
      />

      <NewListsSection
        lists={newLists}
        categoryName={category.name}
      />
    </main>
  );
}
