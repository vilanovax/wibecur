'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useInterestTracking } from '@/hooks/useInterestTracking';
import type { CategoryPageData } from '@/types/category-page';
import {
  CATEGORY_PAGE_SHELL,
  isFilmCategorySlug,
  isLocationCategorySlug,
} from '@/lib/category-layout';
import HomeDeferredMount from '@/components/mobile/home/HomeDeferredMount';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';
import { SectionReveal } from './hub';
import { SponsoredPlacementStack } from '@/components/shared/SponsoredTextBanner';
import type { SponsoredPlacementPublic } from '@/lib/sponsored-placements';
import { CategorySectionSkeleton } from './category-section-skeletons';
import {
  TrendingListsSectionLazy,
  ViralSpotlightSectionLazy,
  NewListsSectionLazy,
  ExploreByCityPillsLazy,
  MostSavedItemsCafeLazy,
  LatestItemsSectionLazy,
  GenreScrollBarLazy,
} from './category-lazy-sections';

interface CategoryPage2ClientProps {
  slug: string;
  initialData?: CategoryPageData | null;
  sponsoredPlacements?: SponsoredPlacementPublic[];
  heroSection?: ReactNode;
  trendingSection?: ReactNode;
  newListsSection?: ReactNode;
  viralSpotlightSection?: ReactNode;
  mostSavedItemsSection?: ReactNode;
  latestItemsSection?: ReactNode;
}

async function fetchCategoryPageData(slug: string): Promise<CategoryPageData> {
  const res = await fetch(`/api/categories/${slug}/page-data`);
  if (!res.ok) throw new Error('خطا در دریافت داده');
  const json = await res.json();
  return json.data;
}

export default function CategoryPage2Client({
  slug,
  initialData = null,
  sponsoredPlacements = [],
  heroSection = null,
  trendingSection = null,
  newListsSection = null,
  viralSpotlightSection = null,
  mostSavedItemsSection = null,
  latestItemsSection = null,
}: CategoryPage2ClientProps) {
  useInterestTracking({ type: 'category_view', categorySlug: slug });

  const { data, isLoading, error } = useQuery({
    queryKey: ['category-page', slug],
    queryFn: () => fetchCategoryPageData(slug),
    enabled: !!slug,
    initialData: initialData ?? undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 3 * 60 * 1000,
    refetchOnMount: initialData ? false : undefined,
    // SSR slots را با refetch پس‌زمینه عوض نکن — فقط داده‌ی کش را تازه کن.
    refetchOnWindowFocus: false,
  });

  if (isLoading && !data) {
    return (
      <main className="min-h-[50vh] animate-pulse bg-wibe-surface">
        <div className={CATEGORY_PAGE_SHELL}>
          <div className="mt-3 aspect-[16/9] rounded-2xl bg-wibe-surface lg:mt-4" />
          <div className="mt-6 h-6 w-48 rounded bg-wibe-surface" />
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-wibe-surface" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-[40vh] flex-col items-center justify-center px-4">
        <p className="wibe-body text-wibe-secondary">خطا در بارگذاری صفحه دسته</p>
      </main>
    );
  }

  const {
    category,
    trendingLists,
    viralSpotlight,
    newLists,
    cityBreakdown = [],
    filmGenres = [],
    mostSavedItems = [],
    latestItems = [],
  } = data;

  const accentColor = category.accentColor || category.color;
  const cityCounts = Object.fromEntries(cityBreakdown.map((c) => [c.city, c.listCount]));
  const showCityExplorer =
    !isLocationCategorySlug(category.slug) &&
    cityBreakdown.some((c) => c.listCount > 0);
  const showGenreBar = isFilmCategorySlug(category.slug);

  const featuredSpotlight =
    viralSpotlight && viralSpotlight.id !== trendingLists[0]?.id ? viralSpotlight : null;

  const trendingTitle = 'داغ‌ترین‌ها';
  const trendingClient = (
    <TrendingListsSectionLazy
      inset
      title={trendingTitle}
      lists={trendingLists}
      categoryName={category.name}
      categorySlug={category.slug}
      accentColor={accentColor}
    />
  );

  const newListsClient = (
    <NewListsSectionLazy inset lists={newLists} categoryName={category.name} />
  );

  const viralSpotlightClient = featuredSpotlight ? (
    <ViralSpotlightSectionLazy list={featuredSpotlight} accentColor={accentColor} inset />
  ) : null;

  const mostSavedItemsClient =
    mostSavedItems.length > 0 ? (
      <MostSavedItemsCafeLazy items={mostSavedItems} accentColor={accentColor} inset />
    ) : null;

  const latestItemsClient =
    latestItems.length > 0 ? (
      <LatestItemsSectionLazy items={latestItems} accentColor={accentColor} inset />
    ) : null;

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    { label: 'دسته‌ها', href: '/categories' },
    { label: category.name },
  ];

  return (
    <main className="scroll-smooth bg-wibe-surface">
      <div className={CATEGORY_PAGE_SHELL}>
        <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
        <PageBreadcrumb className="mb-2 mt-3 lg:mb-3" items={breadcrumbItems} />

        {heroSection}

        {sponsoredPlacements.length > 0 ? (
          <SponsoredPlacementStack placements={sponsoredPlacements} categoryId={category.id} />
        ) : null}

        {showGenreBar && (
          <SectionReveal>
            <GenreScrollBarLazy categorySlug={category.slug} genres={filmGenres} inset />
          </SectionReveal>
        )}

        <SectionReveal>
          {!trendingSection ? trendingClient : trendingSection}
        </SectionReveal>

        {(featuredSpotlight || viralSpotlightSection) && (
          <SectionReveal defer>
            <HomeDeferredMount fallback={<CategorySectionSkeleton />}>
              {!viralSpotlightSection
                ? viralSpotlightClient
                : viralSpotlightSection}
            </HomeDeferredMount>
          </SectionReveal>
        )}

        {showCityExplorer && (
          <SectionReveal defer>
            <HomeDeferredMount fallback={<CategorySectionSkeleton />}>
              <ExploreByCityPillsLazy
                inset
                categorySlug={category.slug}
                cityCounts={cityCounts}
                accentColor={accentColor}
              />
            </HomeDeferredMount>
          </SectionReveal>
        )}

        <SectionReveal defer>
          <HomeDeferredMount fallback={<CategorySectionSkeleton />}>
            {!newListsSection ? newListsClient : newListsSection}
          </HomeDeferredMount>
        </SectionReveal>

        {(mostSavedItemsSection || mostSavedItems.length > 0) && (
          <SectionReveal defer>
            <HomeDeferredMount fallback={<CategorySectionSkeleton />}>
              {!mostSavedItemsSection
                ? mostSavedItemsClient
                : mostSavedItemsSection}
            </HomeDeferredMount>
          </SectionReveal>
        )}

        {(latestItemsSection || latestItems.length > 0) && (
          <SectionReveal defer>
            <HomeDeferredMount fallback={<CategorySectionSkeleton />}>
              {!latestItemsSection ? latestItemsClient : latestItemsSection}
            </HomeDeferredMount>
          </SectionReveal>
        )}
      </div>
    </main>
  );
}
