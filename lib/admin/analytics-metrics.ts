/**
 * Analytics — رشد، محتوا و سلامت ترند.
 * بدون جدول جدید؛ از bookmarks / lists / users و پیشنهادهای باز.
 */

import type { PrismaClient } from '@prisma/client';
import { getListMetrics7d } from '@/lib/trending/service';
import { calculateTrendingScore } from '@/lib/trending/score';
import { TRENDING_THRESHOLDS } from '@/lib/trending/constants';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const ANALYTICS_RANGES = [7, 14, 30] as const;
export type AnalyticsRangeDays = (typeof ANALYTICS_RANGES)[number];

export type GrowthStatus = 'growing' | 'flat' | 'declining';

export interface UserGrowthHealth {
  activeUsers: number;
  newUsers: number;
  growthRate: number;
  returningUsersPercent: number;
  status: GrowthStatus;
  windowDays: AnalyticsRangeDays;
}

export interface ContentEngineHealth {
  newLists: number;
  listsPerActiveUser: number;
  avgSavesPerList: number;
  percentListsZeroSaves: number;
  totalSaves: number;
  windowDays: AnalyticsRangeDays;
}

export interface TrendingHealth {
  avgTrendingScoreTop50: number;
  avgSaveVelocity: number;
  percentEnteringHotZone: number;
  percentRapidlyDeclining: number;
  /** ٪ ذخیره‌های بازه که روی ۱۰ لیست برتر متمرکز است */
  trendDistributionIndex: number;
  windowDays: AnalyticsRangeDays;
}

export interface ChartDay {
  date: string;
  activeUsers: number;
  listsCreated: number;
  saves: number;
}

export interface AnalyticsAction {
  href: string;
  label: string;
}

export interface AnalyticsOverview {
  userGrowth: UserGrowthHealth;
  contentEngine: ContentEngineHealth;
  trending: TrendingHealth;
  chart30d: ChartDay[];
  pendingSuggestions: number;
  windowDays: AnalyticsRangeDays;
}

export function parseAnalyticsRange(raw: string | undefined | null): AnalyticsRangeDays {
  const n = Number(raw);
  if (n === 14 || n === 30 || n === 7) return n;
  return 7;
}

function getCutoffs(windowDays: AnalyticsRangeDays) {
  const now = new Date();
  return {
    now,
    cutoffWindow: new Date(now.getTime() - windowDays * MS_PER_DAY),
    cutoffPrev: new Date(now.getTime() - windowDays * 2 * MS_PER_DAY),
    cutoff30: new Date(now.getTime() - 30 * MS_PER_DAY),
  };
}

function growthStatus(growthRate: number): GrowthStatus {
  if (growthRate > 5) return 'growing';
  if (growthRate < -5) return 'declining';
  return 'flat';
}

/** کاربر فعال = ذخیره کرده یا لیست ساخته در بازه */
async function activeUserIdsInRange(
  prisma: PrismaClient,
  from: Date,
  to?: Date
): Promise<string[]> {
  const bookmarkWhere = to
    ? { createdAt: { gte: from, lt: to } }
    : { createdAt: { gte: from } };
  const listWhere = to
    ? { createdAt: { gte: from, lt: to }, deletedAt: null }
    : { createdAt: { gte: from }, deletedAt: null };

  const [bookmarkUsers, listUsers] = await Promise.all([
    prisma.bookmarks.findMany({
      where: bookmarkWhere,
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.lists.findMany({
      where: listWhere,
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);

  return [...new Set([
    ...bookmarkUsers.map((r) => r.userId),
    ...listUsers.map((r) => r.userId).filter(Boolean) as string[],
  ])];
}

export async function getUserGrowthHealth(
  prisma: PrismaClient,
  windowDays: AnalyticsRangeDays = 7
): Promise<UserGrowthHealth> {
  const { cutoffWindow, cutoffPrev } = getCutoffs(windowDays);

  const [activeThisIds, activeLastIds, newUsersCount] = await Promise.all([
    activeUserIdsInRange(prisma, cutoffWindow),
    activeUserIdsInRange(prisma, cutoffPrev, cutoffWindow),
    prisma.users.count({
      where: {
        createdAt: { gte: cutoffWindow },
        deletedAt: null,
      },
    }),
  ]);

  const activeThis = activeThisIds.length;
  const activeLast = activeLastIds.length;
  const lastSet = new Set(activeLastIds);
  const returning = activeThisIds.filter((id) => lastSet.has(id)).length;

  const growthRate =
    activeLast > 0
      ? Math.round(((activeThis - activeLast) / activeLast) * 1000) / 10
      : activeThis > 0
        ? 100
        : 0;

  const returningUsersPercent =
    activeThis > 0 ? Math.round((returning / activeThis) * 1000) / 10 : 0;

  return {
    activeUsers: activeThis,
    newUsers: newUsersCount,
    growthRate,
    returningUsersPercent,
    status: growthStatus(growthRate),
    windowDays,
  };
}

export async function getContentEngineHealth(
  prisma: PrismaClient,
  windowDays: AnalyticsRangeDays = 7,
  activeUsersCount?: number
): Promise<ContentEngineHealth> {
  const { cutoffWindow } = getCutoffs(windowDays);

  const [
    newLists,
    activeResolved,
    bookmarksInWindow,
    listsWithSaves,
    totalLists,
    listsZeroSaves,
  ] = await Promise.all([
    prisma.lists.count({
      where: {
        createdAt: { gte: cutoffWindow },
        deletedAt: null,
      },
    }),
    activeUsersCount != null
      ? Promise.resolve(activeUsersCount)
      : activeUserIdsInRange(prisma, cutoffWindow).then((ids) => ids.length),
    prisma.bookmarks.count({
      where: { createdAt: { gte: cutoffWindow } },
    }),
    prisma.bookmarks
      .groupBy({
        by: ['listId'],
        where: { createdAt: { gte: cutoffWindow } },
      })
      .then((r) => r.length),
    prisma.lists.count({ where: { deletedAt: null } }),
    prisma.lists.count({
      where: { deletedAt: null, saveCount: 0 },
    }),
  ]);

  const listsPerActiveUser =
    activeResolved > 0
      ? Math.round((newLists / activeResolved) * 100) / 100
      : 0;
  const avgSavesPerList =
    listsWithSaves > 0
      ? Math.round((bookmarksInWindow / listsWithSaves) * 100) / 100
      : 0;
  const percentListsZeroSaves =
    totalLists > 0
      ? Math.round((listsZeroSaves / totalLists) * 1000) / 10
      : 0;

  return {
    newLists,
    listsPerActiveUser,
    avgSavesPerList,
    percentListsZeroSaves,
    totalSaves: bookmarksInWindow,
    windowDays,
  };
}

export async function getTrendingHealth(
  prisma: PrismaClient,
  windowDays: AnalyticsRangeDays = 7
): Promise<TrendingHealth> {
  const { cutoffWindow, cutoffPrev } = getCutoffs(windowDays);

  const [savesPerList, listIdsLastOnly, totalSaves] = await Promise.all([
    prisma.bookmarks.groupBy({
      by: ['listId'],
      where: { createdAt: { gte: cutoffWindow } },
      _count: { listId: true },
    }),
    prisma.bookmarks
      .groupBy({
        by: ['listId'],
        where: { createdAt: { gte: cutoffPrev, lt: cutoffWindow } },
      })
      .then((r) => r.map((x) => x.listId)),
    prisma.bookmarks.count({ where: { createdAt: { gte: cutoffWindow } } }),
  ]);

  const listIdsThis = new Set(savesPerList.map((x) => x.listId));
  const decliningListIds = new Set(
    listIdsLastOnly.filter((id) => !listIdsThis.has(id))
  );

  const listIds = savesPerList.map((x) => x.listId).slice(0, 500);

  const sortedBySaves = [...savesPerList].sort(
    (a, b) => b._count.listId - a._count.listId
  );
  const top10Saves = sortedBySaves
    .slice(0, 10)
    .reduce((s, r) => s + r._count.listId, 0);
  const trendDistributionIndex =
    totalSaves > 0
      ? Math.round((top10Saves / totalSaves) * 1000) / 10
      : 0;

  if (listIds.length === 0) {
    return {
      avgTrendingScoreTop50: 0,
      avgSaveVelocity: 0,
      percentEnteringHotZone: 0,
      percentRapidlyDeclining: 0,
      trendDistributionIndex,
      windowDays,
    };
  }

  const metricsMap = await getListMetrics7d(prisma, listIds, windowDays);
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
      ? Math.round(top50.reduce((s, x) => s + x.score, 0) / top50.length)
      : 0;
  const avgSaveVelocity =
    scores.length > 0
      ? Math.round(
          (scores.reduce((s, x) => s + x.velocity, 0) / scores.length) * 100
        ) / 100
      : 0;
  const enteringHotZone = scores.filter(
    (x) => x.score >= TRENDING_THRESHOLDS.HOT
  ).length;
  const percentEnteringHotZone =
    scores.length > 0
      ? Math.round((enteringHotZone / scores.length) * 1000) / 10
      : 0;

  const totalWithActivityEither = listIds.length + decliningListIds.size;
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
    windowDays,
  };
}

function toDateStr(d: string | Date): string {
  return typeof d === 'string'
    ? d.slice(0, 10)
    : new Date(d).toISOString().slice(0, 10);
}

export async function getChart30d(prisma: PrismaClient): Promise<ChartDay[]> {
  const { cutoff30 } = getCutoffs(7);

  type SaveRow = { date: string | Date; count: number; distinct_users: number };
  type ListRow = { date: string | Date; count: number };

  let savesByDay: SaveRow[] = [];
  let listsByDay: ListRow[] = [];

  try {
    [savesByDay, listsByDay] = await Promise.all([
      prisma.$queryRaw<SaveRow[]>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count, COUNT(DISTINCT "userId")::int as distinct_users
        FROM bookmarks
        WHERE "createdAt" >= ${cutoff30}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      prisma.$queryRaw<ListRow[]>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM lists
        WHERE "createdAt" >= ${cutoff30} AND "deletedAt" IS NULL
        GROUP BY DATE("createdAt")
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

async function getPendingSuggestionsCount(prisma: PrismaClient): Promise<number> {
  const [lists, items, menu] = await Promise.all([
    prisma.suggested_lists.count({ where: { status: 'pending' } }),
    prisma.suggested_items.count({ where: { status: 'pending' } }),
    prisma.list_comments.count({
      where: {
        type: 'suggestion',
        deletedAt: null,
        suggestionStatus: 'pending',
      },
    }),
  ]);
  return lists + items + menu;
}

export async function getAnalyticsOverview(
  prisma: PrismaClient,
  windowDays: AnalyticsRangeDays = 7
): Promise<AnalyticsOverview> {
  const userGrowth = await getUserGrowthHealth(prisma, windowDays);
  const [contentEngine, trending, chart30d, pendingSuggestions] =
    await Promise.all([
      getContentEngineHealth(prisma, windowDays, userGrowth.activeUsers),
      getTrendingHealth(prisma, windowDays),
      getChart30d(prisma),
      getPendingSuggestionsCount(prisma),
    ]);

  return {
    userGrowth,
    contentEngine,
    trending,
    chart30d,
    pendingSuggestions,
    windowDays,
  };
}

export function buildAnalyticsActions(overview: AnalyticsOverview): AnalyticsAction[] {
  const actions: AnalyticsAction[] = [];
  if (overview.pendingSuggestions > 0) {
    actions.push({
      href: '/admin/suggestions?status=pending',
      label: `${overview.pendingSuggestions.toLocaleString('fa-IR')} پیشنهاد در انتظار`,
    });
  }
  if (
    overview.userGrowth.activeUsers === 0 ||
    overview.userGrowth.status === 'declining'
  ) {
    actions.push({
      href: '/admin/custom/featured',
      label: 'چیدن منتخب هوم',
    });
  }
  if (overview.contentEngine.percentListsZeroSaves > 40) {
    actions.push({
      href: '/admin/lists',
      label: 'بررسی لیست‌های بدون ذخیره',
    });
  }
  if (overview.trending.trendDistributionIndex >= 60) {
    actions.push({
      href: '/admin/custom/featured',
      label: 'تنوع‌بخشی به ترند با منتخب',
    });
  }
  if (actions.length === 0) {
    actions.push({ href: '/admin/kpi', label: 'داشبورد رشد (KPI)' });
  }
  return actions.slice(0, 3);
}
