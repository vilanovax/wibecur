/**
 * Analytics MVP — Growth & Algorithm Health
 * فقط مانیتورینگ؛ بدون جدول جدید. از داده‌های موجود.
 */

import type { PrismaClient } from '@prisma/client';
import { getListMetrics7d } from '@/lib/trending/service';
import { calculateTrendingScore } from '@/lib/trending/score';
import { TRENDING_THRESHOLDS } from '@/lib/trending/constants';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type GrowthStatus = 'growing' | 'flat' | 'declining';

export interface UserGrowthHealth {
  activeUsers7d: number;
  newUsers7d: number;
  growthRateWoW: number;
  returningUsersPercent: number;
  status: GrowthStatus;
}

export interface ContentEngineHealth {
  newLists7d: number;
  listsPerActiveUser: number;
  avgSavesPerList7d: number;
  percentListsZeroSaves: number;
}

export interface TrendingHealth {
  avgTrendingScoreTop50: number;
  avgSaveVelocity: number;
  percentEnteringHotZone: number;
  percentRapidlyDeclining: number;
  /** % of total 7d saves captured by Top 10 lists (concentration risk if > 60%) */
  trendDistributionIndex: number;
}

export interface ChartDay {
  date: string;
  activeUsers: number;
  listsCreated: number;
  saves: number;
}

export interface AnalyticsOverview {
  userGrowth: UserGrowthHealth;
  contentEngine: ContentEngineHealth;
  trending: TrendingHealth;
  chart30d: ChartDay[];
}

function getCutoffs() {
  const now = new Date();
  return {
    now,
    cutoff7: new Date(now.getTime() - 7 * MS_PER_DAY),
    cutoff14: new Date(now.getTime() - 14 * MS_PER_DAY),
    cutoff30: new Date(now.getTime() - 30 * MS_PER_DAY),
  };
}

function growthStatus(growthRateWoW: number): GrowthStatus {
  if (growthRateWoW > 5) return 'growing';
  if (growthRateWoW < -5) return 'declining';
  return 'flat';
}

export async function getUserGrowthHealth(
  prisma: PrismaClient
): Promise<UserGrowthHealth> {
  const { cutoff7, cutoff14 } = getCutoffs();

  const [
    activeUserIdsThisWeek,
    activeUserIdsLastWeek,
    newUsersCount,
  ] = await Promise.all([
    prisma.bookmarks.findMany({
      where: { createdAt: { gte: cutoff7 } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.bookmarks.findMany({
      where: {
        createdAt: { gte: cutoff14, lt: cutoff7 },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.users.count({
      where: {
        createdAt: { gte: cutoff7 },
        deletedAt: null,
      },
    }),
  ]);

  const activeThis = activeUserIdsThisWeek.length;
  const activeLast = activeUserIdsLastWeek.length;
  const lastSet = new Set(activeUserIdsLastWeek.map((r) => r.userId));
  const returning = activeUserIdsThisWeek.filter((r) => lastSet.has(r.userId)).length;

  const growthRateWoW =
    activeLast > 0
      ? Math.round(((activeThis - activeLast) / activeLast) * 1000) / 10
      : activeThis > 0
        ? 100
        : 0;

  const returningUsersPercent =
    activeThis > 0 ? Math.round((returning / activeThis) * 1000) / 10 : 0;

  return {
    activeUsers7d: activeThis,
    newUsers7d: newUsersCount,
    growthRateWoW,
    returningUsersPercent,
    status: growthStatus(growthRateWoW),
  };
}

export async function getContentEngineHealth(
  prisma: PrismaClient
): Promise<ContentEngineHealth> {
  const { cutoff7 } = getCutoffs();

  const [
    newLists7d,
    activeUsers7dCount,
    bookmarksIn7d,
    listsWithSavesIn7d,
    totalLists,
    listsZeroSaves,
  ] = await Promise.all([
    prisma.lists.count({
      where: {
        createdAt: { gte: cutoff7 },
        deletedAt: null,
      },
    }),
    prisma.bookmarks.findMany({
      where: { createdAt: { gte: cutoff7 } },
      select: { userId: true },
      distinct: ['userId'],
    }).then((r) => r.length),
    prisma.bookmarks.count({
      where: { createdAt: { gte: cutoff7 } },
    }),
    prisma.bookmarks.groupBy({
      by: ['listId'],
      where: { createdAt: { gte: cutoff7 } },
    }).then((r) => r.length),
    prisma.lists.count({ where: { deletedAt: null } }),
    prisma.lists.count({
      where: { deletedAt: null, saveCount: 0 },
    }),
  ]);

  const listsPerActiveUser =
    activeUsers7dCount > 0
      ? Math.round((newLists7d / activeUsers7dCount) * 100) / 100
      : 0;
  const avgSavesPerList7d =
    listsWithSavesIn7d > 0
      ? Math.round((bookmarksIn7d / listsWithSavesIn7d) * 100) / 100
      : 0;
  const percentListsZeroSaves =
    totalLists > 0
      ? Math.round((listsZeroSaves / totalLists) * 1000) / 10
      : 0;

  return {
    newLists7d,
    listsPerActiveUser,
    avgSavesPerList7d,
    percentListsZeroSaves,
  };
}

export async function getTrendingHealth(
  prisma: PrismaClient
): Promise<TrendingHealth> {
  const { cutoff7, cutoff14 } = getCutoffs();

  const listIdsWithSavesThisWeek = await prisma.bookmarks.groupBy({
    by: ['listId'],
    where: { createdAt: { gte: cutoff7 } },
  }).then((r) => r.map((x) => x.listId));

  const listIdsWithSavesLastWeekOnly = await prisma.bookmarks.groupBy({
    by: ['listId'],
    where: {
      createdAt: { gte: cutoff14, lt: cutoff7 },
    },
  }).then((r) => r.map((x) => x.listId));

  const listIdsThis = new Set(listIdsWithSavesThisWeek);
  const decliningListIds = new Set(
    listIdsWithSavesLastWeekOnly.filter((id) => !listIdsThis.has(id))
  );

  const listIds = listIdsWithSavesThisWeek.slice(0, 500);

  const totalSaves7d = await prisma.bookmarks.count({
    where: { createdAt: { gte: cutoff7 } },
  });
  const savesPerList7d = await prisma.bookmarks.groupBy({
    by: ['listId'],
    where: { createdAt: { gte: cutoff7 } },
    _count: { listId: true },
  });
  const sortedBySaves = savesPerList7d.sort((a, b) => b._count.listId - a._count.listId);
  const top10Saves = sortedBySaves.slice(0, 10).reduce((s, r) => s + r._count.listId, 0);
  const trendDistributionIndex =
    totalSaves7d > 0
      ? Math.round((top10Saves / totalSaves7d) * 1000) / 10
      : 0;

  if (listIds.length === 0) {
    return {
      avgTrendingScoreTop50: 0,
      avgSaveVelocity: 0,
      percentEnteringHotZone: 0,
      percentRapidlyDeclining: 0,
      trendDistributionIndex,
    };
  }

  const metricsMap = await getListMetrics7d(prisma, listIds, 7);
  const scores: { listId: string; score: number; velocity: number }[] = [];

  for (const id of listIds) {
    const m = metricsMap.get(id);
    if (m) {
      scores.push({
        listId: id,
        score: calculateTrendingScore(m),
        velocity: m.SaveVelocity,
      });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  const top50 = scores.slice(0, 50);
  const avgTrendingScoreTop50 =
    top50.length > 0
      ? Math.round(
          top50.reduce((s, x) => s + x.score, 0) / top50.length
        )
      : 0;
  const avgSaveVelocity =
    scores.length > 0
      ? Math.round(
          (scores.reduce((s, x) => s + x.velocity, 0) / scores.length) * 100
        ) / 100
      : 0;
  const enteringHotZone = scores.filter((x) => x.score >= TRENDING_THRESHOLDS.HOT).length;
  const percentEnteringHotZone =
    scores.length > 0
      ? Math.round((enteringHotZone / scores.length) * 1000) / 10
      : 0;

  const totalWithActivityEither =
    listIds.length + decliningListIds.size;
  const percentRapidlyDeclining =
    totalWithActivityEither > 0
      ? Math.round(
          (decliningListIds.size / totalWithActivityEither) * 1000
        ) / 10
      : 0;

  return {
    avgTrendingScoreTop50,
    avgSaveVelocity,
    percentEnteringHotZone,
    percentRapidlyDeclining,
    trendDistributionIndex,
  };
}

function toDateStr(d: string | Date): string {
  return typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
}

export async function getChart30d(
  prisma: PrismaClient
): Promise<ChartDay[]> {
  const { cutoff30 } = getCutoffs();

  type SaveRow = { date: string | Date; count: number; distinct_users: number };
  type ListRow = { date: string | Date; count: number };

  let savesByDay: SaveRow[] = [];
  let listsByDay: ListRow[] = [];

  try {
    [savesByDay, listsByDay] = await Promise.all([
      prisma.$queryRaw<SaveRow[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count, COUNT(DISTINCT user_id)::int as distinct_users
        FROM bookmarks
        WHERE created_at >= ${cutoff30}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      prisma.$queryRaw<ListRow[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM lists
        WHERE created_at >= ${cutoff30} AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);
  } catch {
    savesByDay = [];
    listsByDay = [];
  }

  const saveMap = new Map<string, { saves: number; activeUsers: number }>();
  for (const r of savesByDay) {
    const d = toDateStr(r.date);
    saveMap.set(d, { saves: r.count, activeUsers: r.distinct_users ?? 0 });
  }
  const listMap = new Map<string, number>();
  for (const r of listsByDay) {
    listMap.set(toDateStr(r.date), r.count);
  }

  const days: ChartDay[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(cutoff30);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const save = saveMap.get(dateStr);
    days.push({
      date: dateStr,
      activeUsers: save?.activeUsers ?? 0,
      listsCreated: listMap.get(dateStr) ?? 0,
      saves: save?.saves ?? 0,
    });
  }
  return days;
}

export async function getAnalyticsOverview(
  prisma: PrismaClient
): Promise<AnalyticsOverview> {
  const [userGrowth, contentEngine, trending, chart30d] = await Promise.all([
    getUserGrowthHealth(prisma),
    getContentEngineHealth(prisma),
    getTrendingHealth(prisma),
    getChart30d(prisma),
  ]);

  return {
    userGrowth,
    contentEngine,
    trending,
    chart30d,
  };
}
