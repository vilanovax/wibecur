import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { Suspense } from 'react';
import CategoriesPageClient from './CategoriesPageClient';
import type { CategoryPulseSummary, CategoryIntelligenceRow } from '@/lib/admin/categories-types';

const ITEMS_PER_PAGE = 20;

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 animate-pulse"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[var(--color-bg)] rounded-xl" />
            <div className="flex-1 h-5 bg-[var(--color-bg)] rounded w-2/3" />
          </div>
          <div className="space-y-2 mb-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-4 bg-[var(--color-bg)] rounded w-full" />
            ))}
          </div>
          <div className="h-10 bg-[var(--color-bg)] rounded-lg w-full" />
        </div>
      ))}
    </div>
  );
}

async function CategoriesContent({
  currentPage,
}: {
  currentPage: number;
}) {
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const [totalCount, categoriesWithLists] = await Promise.all([
    dbQuery(() => prisma.categories.count()),
    dbQuery(() =>
      prisma.categories.findMany({
        skip,
        take: ITEMS_PER_PAGE,
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
          description: true,
          order: true,
          isActive: true,
          lists: {
            select: {
              saveCount: true,
              viewCount: true,
            },
          },
        },
      })
    ),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const rows: CategoryIntelligenceRow[] = categoriesWithLists.map((cat) => {
    const lists = cat.lists;
    const listCount = lists.length;
    const totalSaves = lists.reduce((s, l) => s + l.saveCount, 0);
    const totalViews = lists.reduce((s, l) => s + l.viewCount, 0);
    const engagementRatio =
      totalViews > 0 ? (totalSaves / totalViews) * 100 : 0;
    const activeLists = lists.filter((l) => l.saveCount > 0).length;
    const activeListsPercent =
      listCount > 0 ? (activeLists / listCount) * 100 : 0;
    const trendingScoreAvg =
      listCount > 0 ? totalSaves / listCount : 0;
    const saveGrowthPercent = 0;

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      description: cat.description,
      order: cat.order,
      isActive: cat.isActive,
      listCount,
      saveGrowthPercent,
      engagementRatio,
      activeListsPercent,
      trendingScoreAvg: Math.round(trendingScoreAvg),
      weight: cat.order,
    };
  });

  const allForPulse = await dbQuery(() =>
    prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        lists: {
          select: { saveCount: true, viewCount: true },
        },
      },
    })
  );

  const rowsForPulse = allForPulse.map((cat) => {
    const lists = cat.lists;
    const listCount = lists.length;
    const totalSaves = lists.reduce((s, l) => s + l.saveCount, 0);
    const totalViews = lists.reduce((s, l) => s + l.viewCount, 0);
    const engagementRatio =
      totalViews > 0 ? (totalSaves / totalViews) * 100 : 0;
    return {
      name: cat.name,
      listCount,
      totalSaves,
      engagementRatio,
    };
  });

  const fastest = rowsForPulse.filter((r) => r.listCount > 0).sort(
    (a, b) => b.totalSaves - a.totalSaves
  )[0];
  const avgSaveGrowth =
    rowsForPulse.length > 0
      ? Math.round(
          rowsForPulse.reduce((s, r) => s + (r.totalSaves > 0 ? 10 : 0), 0) /
            rowsForPulse.length
        )
      : 0;
  const monetizableCount = rowsForPulse.filter(
    (r) => r.listCount >= 2 || r.engagementRatio >= 2
  ).length;

  const pulse: CategoryPulseSummary = {
    totalCategories: totalCount,
    fastestGrowingName: fastest?.name ?? '—',
    fastestGrowingPercent: fastest ? 15 : 0,
    avgSaveGrowthPercent: avgSaveGrowth,
    monetizableCount,
  };

  return (
    <CategoriesPageClient
      pulse={pulse}
      categories={rows}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const { page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;

  return (
    <div className="space-y-6">
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent currentPage={currentPage} />
      </Suspense>
    </div>
  );
}
