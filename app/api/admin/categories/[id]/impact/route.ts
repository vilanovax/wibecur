import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { getListMetrics7d } from '@/lib/trending/service';
import { calculateTrendingScore } from '@/lib/trending/score';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type CategoryImpactResponse = {
  weeklySaveShare: number;
  growingLists: number;
  avgTrendingScore: number;
  engagementGrowth: number;
  trendDirection: 'up' | 'down' | 'stable';
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_categories');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id: categoryId } = await params;

    const now = new Date();
    const cutoff7 = new Date(now.getTime() - 7 * MS_PER_DAY);
    const cutoff14 = new Date(now.getTime() - 14 * MS_PER_DAY);

    const listIds = await prisma.lists
      .findMany({
        where: { categoryId, deletedAt: null },
        select: { id: true },
      })
      .then((rows) => rows.map((r) => r.id));

    if (listIds.length === 0) {
      return NextResponse.json<CategoryImpactResponse>({
        weeklySaveShare: 0,
        growingLists: 0,
        avgTrendingScore: 0,
        engagementGrowth: 0,
        trendDirection: 'stable',
      });
    }

    const [
      categoryWeeklySaves,
      totalWeeklySaves,
      growingListIdsResult,
      categorySavesLastWeek,
    ] = await Promise.all([
      prisma.bookmarks.count({
        where: {
          listId: { in: listIds },
          createdAt: { gte: cutoff7 },
        },
      }),
      prisma.bookmarks.count({
        where: { createdAt: { gte: cutoff7 } },
      }),
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: {
          listId: { in: listIds },
          createdAt: { gte: cutoff7 },
        },
      }),
      prisma.bookmarks.count({
        where: {
          listId: { in: listIds },
          createdAt: { gte: cutoff14, lt: cutoff7 },
        },
      }),
    ]);

    const growingLists = growingListIdsResult.length;
    const weeklySaveShare =
      totalWeeklySaves > 0
        ? Math.round((categoryWeeklySaves / totalWeeklySaves) * 1000) / 10
        : 0;

    const engagementGrowth =
      categorySavesLastWeek > 0
        ? Math.round(
            ((categoryWeeklySaves - categorySavesLastWeek) /
              categorySavesLastWeek) *
              1000
          ) / 10
        : categoryWeeklySaves > 0
          ? 100
          : 0;

    const trendDirection: 'up' | 'down' | 'stable' =
      engagementGrowth > 0 ? 'up' : engagementGrowth < 0 ? 'down' : 'stable';

    const metricsMap = await getListMetrics7d(prisma, listIds, 7);
    let sumScore = 0;
    let countScore = 0;
    for (const listId of listIds) {
      const m = metricsMap.get(listId);
      if (m) {
        sumScore += calculateTrendingScore(m);
        countScore += 1;
      }
    }
    const avgTrendingScore =
      countScore > 0 ? Math.round(sumScore / countScore) : 0;

    return NextResponse.json<CategoryImpactResponse>({
      weeklySaveShare,
      growingLists,
      avgTrendingScore,
      engagementGrowth,
      trendDirection,
    });
  } catch (error: unknown) {
    console.error('Category impact error:', error);
    return NextResponse.json(
      { error: 'خطا در محاسبه تاثیر دسته' },
      { status: 500 }
    );
  }
}
