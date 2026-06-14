'use client';

import { useQuery } from '@tanstack/react-query';
import type { CategoryPageData } from '@/types/category-page';
import {
  CATEGORY_PAGE_SHELL,
  isFilmCategorySlug,
  isLocationCategorySlug,
} from '@/lib/category-layout';
import CategoryStandardHero from './CategoryStandardHero';
import TrendingListsSection from './TrendingListsSection';
import ViralSpotlightSection from './ViralSpotlightSection';
import NewListsSection from './NewListsSection';
import CategoryCreateCTA from './CategoryCreateCTA';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';
import { ExploreByCityPills, MostSavedItemsCafe, SectionReveal } from './hub';
import { GenreScrollBar } from './film';

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
    return (
      <main className="min-h-[50vh] animate-pulse bg-wibe-surface">
        <div className={CATEGORY_PAGE_SHELL}>
          <div className="mt-3 aspect-[16/9] rounded-2xl bg-gray-200 lg:mt-4" />
          <div className="mt-6 h-6 w-48 rounded bg-gray-200" />
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-gray-200" />
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
    metrics,
    trendingLists,
    viralSpotlight,
    newLists,
    cityBreakdown = [],
    filmGenres = [],
    mostSavedItems = [],
  } = data;

  const accentColor = category.accentColor || category.color;
  const cityCounts = Object.fromEntries(cityBreakdown.map((c) => [c.city, c.listCount]));
  const showCityExplorer =
    isLocationCategorySlug(category.slug) || cityBreakdown.some((c) => c.listCount > 0);
  const showGenreBar = isFilmCategorySlug(category.slug);

  const featuredSpotlight =
    viralSpotlight && viralSpotlight.id !== trendingLists[0]?.id ? viralSpotlight : null;

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

        <CategoryStandardHero category={category} metrics={metrics} />

        {showGenreBar && (
          <SectionReveal>
            <GenreScrollBar categorySlug={category.slug} genres={filmGenres} inset />
          </SectionReveal>
        )}

        <SectionReveal>
          <TrendingListsSection
            inset
            title={`داغ‌ترین لیست‌های هفته در ${category.name}`}
            subtitle="بر اساس ذخیره و engagement"
            lists={trendingLists}
            categoryName={category.name}
            categorySlug={category.slug}
            accentColor={accentColor}
          />
        </SectionReveal>

        {featuredSpotlight && (
          <SectionReveal>
            <ViralSpotlightSection list={featuredSpotlight} accentColor={accentColor} inset />
          </SectionReveal>
        )}

        {showCityExplorer && (
          <SectionReveal>
            <ExploreByCityPills
              inset
              categorySlug={category.slug}
              cityCounts={cityCounts}
              accentColor={accentColor}
            />
          </SectionReveal>
        )}

        <SectionReveal>
          <NewListsSection inset lists={newLists} categoryName={category.name} />
        </SectionReveal>

        {mostSavedItems.length > 0 && (
          <SectionReveal>
            <MostSavedItemsCafe items={mostSavedItems} accentColor={accentColor} inset />
          </SectionReveal>
        )}

        <SectionReveal>
          <CategoryCreateCTA categorySlug={category.slug} categoryName={category.name} />
        </SectionReveal>
      </div>
    </main>
  );
}
