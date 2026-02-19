import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/has-permission';
import { auth } from '@/lib/auth-config';
import { notFound } from 'next/navigation';
import { dbQuery } from '@/lib/db';
import CategoryEditForm from './CategoryEditForm';

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

  const listCount = category._count.lists;
  const lists = category.lists;
  const totalSaves = lists.reduce((s, l) => s + l.saveCount, 0);
  const totalViews = lists.reduce((s, l) => s + l.viewCount, 0);
  const engagementRatio =
    totalViews > 0 ? (totalSaves / totalViews) * 100 : 0;
  const trendingScoreAvg =
    listCount > 0 ? Math.round(totalSaves / listCount) : 0;

  const analytics = {
    listCount,
    saveGrowthPercent: 0,
    engagementRatio,
    trendingScoreAvg,
  };

  const session = await auth();
  const canEditWeight =
    !!session?.user?.role && hasPermission(session.user.role, 'set_category_weight');

  return (
    <div className="max-w-4xl">
      <CategoryEditForm
        category={category}
        analytics={analytics}
        canEditWeight={canEditWeight}
      />
    </div>
  );
}
