import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/has-permission';
import { auth } from '@/lib/auth-config';
import { notFound } from 'next/navigation';
import { dbQuery } from '@/lib/db';
import CategoryEditForm from './CategoryEditForm';
import {
  computeCategoryListMetrics,
  getCategorySaveGrowthMap,
  getCategoryUniqueItemCountMap,
} from '@/lib/admin/category-intelligence';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const category = await dbQuery(() =>
    prisma.categories.findUnique({
      where: { id },
      include: {
        lists: {
          where: { deletedAt: null },
          select: {
            saveCount: true,
            viewCount: true,
          },
        },
        _count: {
          select: { lists: true },
        },
      },
    })
  );

  if (!category) {
    notFound();
  }

  const metrics = computeCategoryListMetrics(category.lists);
  const [growthMap, uniqueItemMap] = await Promise.all([
    getCategorySaveGrowthMap(prisma, [id]),
    getCategoryUniqueItemCountMap(prisma, [id]),
  ]);
  const growth = growthMap.get(id) ?? { percent: 0, recent: 0, previous: 0 };

  const analytics = {
    listCount: category.lists.length,
    uniqueItemCount: uniqueItemMap.get(id) ?? 0,
    saveGrowthPercent: growth.percent,
    saveGrowthRecent: growth.recent,
    saveGrowthPrevious: growth.previous,
    engagementRatio: metrics.engagementRatio,
    avgSavesPerList: Math.round(metrics.avgSavesPerList * 10) / 10,
  };

  const session = await auth();
  const canEditWeight =
    !!session?.user?.role &&
    hasPermission(session.user.role, 'set_category_weight', session.user.adminPermissions);

  return (
    <div className="max-w-5xl">
      <CategoryEditForm
        category={category}
        analytics={analytics}
        canEditWeight={canEditWeight}
      />
    </div>
  );
}
