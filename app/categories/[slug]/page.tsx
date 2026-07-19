import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CategoryNavStrip from '@/components/shared/CategoryNavStrip';
import { notFound } from 'next/navigation';
import CategoryPage2Client from '@/components/category/CategoryPage2Client';
import CategoryHeroServer from '@/components/category/CategoryHeroServer';
import CategoryTrendingSectionServer from '@/components/category/CategoryTrendingSectionServer';
import CategoryNewListsSectionServer from '@/components/category/CategoryNewListsSectionServer';
import CategoryViralSpotlightSectionServer from '@/components/category/CategoryViralSpotlightSectionServer';
import CategoryMostSavedItemsServer from '@/components/category/CategoryMostSavedItemsServer';
import CategoryLatestItemsServer from '@/components/category/CategoryLatestItemsServer';
import HomeLcpPreload from '@/components/mobile/home/HomeLcpPreload';
import { resolveCategoryBySlug } from '@/lib/category-resolve';
import { getCachedCategoryPageData } from '@/lib/category-page-cached';
import { getCachedCategoryBannerPlacements } from '@/lib/sponsored-placements';
import { fetchActiveCategoryMenu } from '@/lib/category-menu';
import { getCategoryHeroDisplayUrl } from '@/lib/display-image';

// داده‌های صفحه با unstable_cache تا ۳۰۰ ثانیه کش می‌شوند؛ revalidate صفحه هم
// با همان پنجره هماهنگ شد تا پوستهٔ صفحه بی‌جهت هر ۶۰ ثانیه بازتولید نشود.
export const revalidate = 300;

function isDbError(e: unknown): boolean {
  const err = e as Error & { code?: string };
  const msg = String(err?.message ?? '');
  return (
    err?.code === 'P1001' ||
    msg.includes("Can't reach database") ||
    msg.includes('Invalid value undefined for datasource') ||
    msg.includes('PrismaClient')
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const category = await resolveCategoryBySlug(slug);
    if (!category) return { title: 'دسته‌بندی یافت نشد' };
    return {
      title: `لیست‌های ${category.name}`,
      description: `کشف بهترین لیست‌های کیوریتد در دسته ${category.name}`,
    };
  } catch (e) {
    if (isDbError(e)) return { title: 'دسته‌بندی یافت نشد' };
    throw e;
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let category;
  let pageData = null;
  let menuCategories: Awaited<ReturnType<typeof fetchActiveCategoryMenu>> = [];

  try {
    category = await resolveCategoryBySlug(slug);
    if (category) {
      [pageData, menuCategories] = await Promise.all([
        getCachedCategoryPageData(category.id, category.slug),
        fetchActiveCategoryMenu(),
      ]);
    }
  } catch (e) {
    if (isDbError(e) || process.env.NODE_ENV === 'development') {
      notFound();
    }
    throw e;
  }

  if (!category || !pageData) {
    notFound();
  }

  const sponsoredPlacements = await getCachedCategoryBannerPlacements(category.id);
  const lcpImage = getCategoryHeroDisplayUrl(pageData.category.heroImage, pageData.category.slug);
  const accentColor = pageData.category.accentColor || pageData.category.color;
  const featuredSpotlight =
    pageData.viralSpotlight &&
    pageData.viralSpotlight.id !== pageData.trendingLists[0]?.id
      ? pageData.viralSpotlight
      : null;

  return (
    <>
      <HomeLcpPreload href={lcpImage} />
      <div className="bg-wibe-surface">
        <Header title={category.name} showBack showDesktopSearch={false} />
        <CategoryNavStrip
          activeSlug={category.slug}
          initialCategories={menuCategories}
        />
        <CategoryPage2Client
          slug={category.slug}
          initialData={pageData}
          sponsoredPlacements={sponsoredPlacements}
          heroSection={
            <CategoryHeroServer category={pageData.category} metrics={pageData.metrics} />
          }
          trendingSection={
            <CategoryTrendingSectionServer
              inset
              title="داغ‌ترین‌ها"
              lists={pageData.trendingLists}
              categorySlug={pageData.category.slug}
              accentColor={pageData.category.accentColor || pageData.category.color}
            />
          }
          newListsSection={
            <CategoryNewListsSectionServer
              inset
              lists={pageData.newLists}
              categoryName={pageData.category.name}
            />
          }
          viralSpotlightSection={
            featuredSpotlight ? (
              <CategoryViralSpotlightSectionServer inset list={featuredSpotlight} />
            ) : null
          }
          mostSavedItemsSection={
            pageData.mostSavedItems && pageData.mostSavedItems.length > 0 ? (
              <CategoryMostSavedItemsServer
                inset
                items={pageData.mostSavedItems}
                accentColor={accentColor}
              />
            ) : null
          }
          latestItemsSection={
            pageData.latestItems && pageData.latestItems.length > 0 ? (
              <CategoryLatestItemsServer
                inset
                items={pageData.latestItems}
                accentColor={accentColor}
              />
            ) : null
          }
        />
        <BottomNav />
      </div>
    </>
  );
}
