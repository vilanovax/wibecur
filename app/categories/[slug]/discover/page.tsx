import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CategoryNavStrip from '@/components/shared/CategoryNavStrip';
import { notFound } from 'next/navigation';
import DiscoveryResultsClient from '@/components/category/discovery/DiscoveryResultsClient';
import { resolveCategoryBySlug } from '@/lib/category-resolve';
import { browseCategoryDiscoveryTopic } from '@/lib/category-discovery/from-db';
import { supportsCategoryDiscovery } from '@/lib/category-discovery/supports';
import { fetchActiveCategoryMenu } from '@/lib/category-menu';
import { CATEGORY_PAGE_SHELL } from '@/lib/category-layout';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

export const revalidate = 180;

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

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ topic?: string }>;
}) {
  const { slug } = await params;
  const { topic } = await searchParams;
  try {
    const category = await resolveCategoryBySlug(slug);
    if (!category) return { title: 'موضوع کشف' };
    const label = topic?.trim() || 'کشف';
    return {
      title: `${label} · ${category.name}`,
      description: `لیست‌ها و مکان‌های مرتبط با ${label} در ${category.name}`,
    };
  } catch {
    return { title: 'موضوع کشف' };
  }
}

export default async function CategoryDiscoverPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ topic?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const topicRaw = (sp.topic ?? '').trim();
  const tab = sp.tab === 'places' ? 'places' : 'lists';

  if (!topicRaw) {
    notFound();
  }

  let category;
  let menuCategories: Awaited<ReturnType<typeof fetchActiveCategoryMenu>> = [];
  let initialData = null;

  try {
    category = await resolveCategoryBySlug(slug);
    if (!category || !supportsCategoryDiscovery(category.slug)) {
      notFound();
    }
    [menuCategories, initialData] = await Promise.all([
      fetchActiveCategoryMenu(),
      dbQuery(() =>
        browseCategoryDiscoveryTopic(prisma, category!.id, category!.slug, topicRaw)
      ),
    ]);
  } catch (e) {
    if (isDbError(e) || process.env.NODE_ENV === 'development') {
      notFound();
    }
    throw e;
  }

  if (!category || !initialData) notFound();

  const fullCategory = await dbQuery(() =>
    prisma.categories.findUnique({
      where: { id: category!.id },
      select: { icon: true, iconImage: true, name: true },
    })
  );

  return (
    <div className="bg-background">
      <Header title={fullCategory?.name ?? category.name} showBack showDesktopSearch={false} />
      <CategoryNavStrip activeSlug={category.slug} initialCategories={menuCategories} />
      <main className={CATEGORY_PAGE_SHELL}>
        <DiscoveryResultsClient
          categorySlug={category.slug}
          categoryName={fullCategory?.name ?? category.name}
          categoryIcon={fullCategory?.icon}
          categoryIconImage={fullCategory?.iconImage}
          topicSlug={topicRaw}
          initialTab={tab}
          initialData={initialData}
        />
      </main>
      <BottomNav />
    </div>
  );
}
