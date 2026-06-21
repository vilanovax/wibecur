import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CategoryNavStrip from '@/components/shared/CategoryNavStrip';
import { notFound } from 'next/navigation';
import CategoryPage2Client from '@/components/category/CategoryPage2Client';
import { resolveCategoryBySlug } from '@/lib/category-resolve';
import { getCachedCategoryPageData } from '@/lib/category-page-cached';
import { getCachedCategoryBannerPlacements } from '@/lib/sponsored-placements';

export const revalidate = 60;

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

  try {
    category = await resolveCategoryBySlug(slug);
    if (category) {
      pageData = await getCachedCategoryPageData(category.id);
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

  const initialData = JSON.parse(JSON.stringify(pageData));
  const sponsoredPlacements = await getCachedCategoryBannerPlacements(category.id);

  return (
    <div className="bg-wibe-surface">
      <Header title={category.name} showBack showDesktopSearch={false} />
      <CategoryNavStrip activeSlug={category.slug} />
      <CategoryPage2Client
        slug={category.slug}
        initialData={initialData}
        sponsoredPlacements={JSON.parse(JSON.stringify(sponsoredPlacements))}
      />
      <BottomNav />
    </div>
  );
}
