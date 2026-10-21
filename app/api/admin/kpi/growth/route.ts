import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // محاسبهٔ KPI بسیار سنگین است (~۸۰+ کوئری). کش ۲ دقیقه‌ای تا هر ناوبری/remount
    // کل تجمیع را دوباره اجرا نکند. برای ابطال: revalidateTag('admin-kpi').
    const getCachedGrowth = unstable_cache(
      async () => dbQuery(async () => {
      const now = new Date();
      const todayStart = startOfDay(now);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const twoWeeksStart = new Date(now);
      twoWeeksStart.setDate(twoWeeksStart.getDate() - 14);
      const thirtyDaysStart = new Date(now);
      thirtyDaysStart.setDate(thirtyDaysStart.getDate() - 30);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const eightDaysAgo = new Date(now);
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      const thirtyOneDaysAgo = new Date(now);
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const [
        activeUsersToday,
        savesToday,
        newListsToday,
        pendingItems,
        pendingLists,
        savesWeek,
        sugWeekItems,
        sugWeekLists,
        commentsWeek,
        listsCreatedWeek,
        totalUsers,
        returningUsersWeek,
        newUsersLast7,
        newUsersWithFirstSave,
        d1Retention,
        d7Retention,
        d30Retention,
        pulseScoreLastWeek,
        activeUsers7d,
      ] = await Promise.all([
        getActiveUsersCount(todayStart),
        prisma.bookmarks.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.lists.count({
          where: { createdAt: { gte: todayStart }, isPublic: true },
        }),
        prisma.suggested_items.count({ where: { status: 'pending' } }),
        prisma.suggested_lists.count({ where: { status: 'pending' } }),
        prisma.bookmarks.count({ where: { createdAt: { gte: weekStart } } }),
        prisma.suggested_items.count({ where: { createdAt: { gte: weekStart } } }),
        prisma.suggested_lists.count({ where: { createdAt: { gte: weekStart } } }),
        prisma.comments.count({
          where: { createdAt: { gte: weekStart }, deletedAt: null },
        }),
        prisma.lists.count({
          where: { createdAt: { gte: weekStart }, isPublic: true },
        }),
        prisma.users.count({ where: { role: 'USER', isActive: true } }),
        getReturningUsersCount(weekStart, now),
        prisma.users.count({
          where: { createdAt: { gte: weekStart }, role: 'USER' },
        }),
        getNewUsersWithSaveIn24h(weekStart),
        getD1Retention(yesterdayStart, todayStart),
        getD7Retention(eightDaysAgo, weekStart),
        getD30Retention(thirtyOneDaysAgo, thirtyDaysStart),
        getPulseScoreForPeriod(twoWeeksStart, weekStart),
        getActiveUsersCount(weekStart),
      ]);
      const suggestionsPending = pendingItems + pendingLists;
      const suggestionsWeek = sugWeekItems + sugWeekLists;

      const engagementRaw = savesWeek * 1 + suggestionsWeek * 2 + commentsWeek * 1.5;
      const engagementScore = Math.min(100, Math.round((engagementRaw / 200) * 100));
      const retentionComponent =
        totalUsers > 0
          ? Math.min(100, (returningUsersWeek / Math.max(1, totalUsers)) * 200)
          : 0;
      const pulseRaw =
        Math.min(100, (savesWeek / 50) * 25) +
        Math.min(100, (suggestionsWeek / 20) * 25) +
        Math.min(100, (listsCreatedWeek / 10) * 25) +
        Math.min(100, retentionComponent / 4);
      const pulseScore = Math.round(Math.min(100, pulseRaw));
      const activationPct =
        newUsersLast7 > 0
          ? Math.round((newUsersWithFirstSave / newUsersLast7) * 100)
          : 0;
      const pulseScoreWeeklyChange = pulseScore - pulseScoreLastWeek;
      const pulseStatus: 'up' | 'down' | 'stable' =
        pulseScoreWeeklyChange > 0 ? 'up' : pulseScoreWeeklyChange < 0 ? 'down' : 'stable';

      // ——— سری‌های چارت و KPI کارت‌ها ———
      const [
        activeUsersLast30Days,
        savesVsSuggestionsLast14,
        newListsPerWeek,
        savesVsListsLast30Days,
        kpiCards,
        trendingItems,
        fastestGrowingCategories,
        suggestionPanel,
        creatorStats,
        activityFeed,
      ] = await Promise.all([
        getActiveUsersLast30Days(thirtyDaysStart, now),
        getSavesVsSuggestionsLast14(todayStart),
        getNewListsPerWeek(6),
        getSavesVsListsLast30Days(thirtyDaysStart, now),
        getKpiCardsSeries(weekStart, twoWeeksStart, now, todayStart),
        getTrendingItems(weekStart, 5),
        getFastestGrowingCategories(weekStart, 5),
        getSuggestionPanelStats(),
        getCreatorStats(),
        getActivityFeed(30),
      ]);

      const [topListsWeek, topItemsByVotes, topListsBySave, topCreators] = await Promise.all([
        getTopListsThisWeek(weekStart, 5),
        getTopItemsByVelocity(weekStart, 5),
        prisma.lists.findMany({
          where: { isPublic: true, isActive: true },
          orderBy: { saveCount: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            slug: true,
            saveCount: true,
            categories: { select: { name: true, icon: true } },
          },
        }),
        getTopCreatorsByActivity(10),
      ]);
      const fastestCategory = fastestGrowingCategories[0]
        ? {
            id: fastestGrowingCategories[0].id,
            name: fastestGrowingCategories[0].name,
            icon: fastestGrowingCategories[0].icon,
            slug: fastestGrowingCategories[0].slug,
            growth: fastestGrowingCategories[0].growth,
          }
        : null;

      const suggestionQualityRate = suggestionPanel.approvalRate;

      // ——— Pulse Breakdown (۰–۱۰) برای نمایش شفاف ———
      const retentionAvg = (d1Retention + d7Retention + (d30Retention ?? 0)) / 3;
      const contentGrowthRaw = Math.min(
        100,
        (listsCreatedWeek / 5) * 25 + (suggestionsWeek / 10) * 25
      );
      const creatorActivityRaw = creatorStats
        ? Math.min(100, (creatorStats.listsWith50PlusSaves / 5) * 25 + creatorStats.pctUsersWith2PlusLists * 2.5)
        : 0;
      const pulseBreakdown = {
        engagement: Math.round((engagementScore / 10) * 10) / 10,
        retention: Math.round(Math.min(10, retentionAvg / 10) * 10) / 10,
        contentGrowth: Math.round((contentGrowthRaw / 10) * 10) / 10,
        creatorActivity: Math.round((creatorActivityRaw / 10) * 10) / 10,
      };

      return {
        pulseScore,
        pulseScoreWeeklyChange,
        pulseStatus,
        pulseBreakdown,
        activeUsers7d,
        newLists7d: listsCreatedWeek,
        suggestionApprovalRate: suggestionPanel?.approvalRate ?? suggestionQualityRate,
        overview: {
          activeUsersToday,
          savesToday,
          newListsToday,
          suggestionsPending,
        },
        engagementScore,
        engagementDetail: {
          savesWeek,
          suggestionsWeek,
          commentsWeek,
          listsCreatedWeek,
        },
        activation: {
          pctFirstSaveIn24h: activationPct,
          newUsersLast7,
          newUsersWithFirstSave,
        },
        retention: {
          d1Retention,
          d7Retention,
          d30Retention,
        },
        topMovers: {
          topListsWeek,
          topItemsByVotes,
          fastestCategory,
        },
        creatorSpotlight: {
          topListsBySave,
          topCreators,
        },
        suggestionQualityRate,
        charts: {
          activeUsersLast30Days,
          savesVsSuggestionsLast14,
          newListsPerWeek,
          savesVsListsLast30Days,
        },
        kpiCards,
        trendingItems,
        fastestGrowingCategories,
        suggestionPanel,
        creatorStats,
        activityFeed,
      };
      }),
      ['admin-kpi-growth-v2'],
      { revalidate: 120, tags: ['admin-kpi'] }
    );
    const data = await getCachedGrowth();

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('KPI growth error:', err);
    return NextResponse.json(
      { error: 'خطا در محاسبه KPI' },
      { status: 500 }
    );
  }
}

async function countDistinct(rows: { n: number }[]): Promise<number> {
  return Number(rows[0]?.n ?? 0);
}

async function getActiveUsersCount(since: Date) {
  const rows = await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM (
      SELECT "userId" FROM bookmarks WHERE "createdAt" >= ${since}
      UNION
      SELECT "userId" FROM comments WHERE "createdAt" >= ${since} AND "deletedAt" IS NULL
      UNION
      SELECT "userId" FROM item_votes WHERE "createdAt" >= ${since}
      UNION
      SELECT "userId" FROM lists WHERE "createdAt" >= ${since}
    ) active
  `;
  return countDistinct(rows);
}

async function getReturningUsersCount(from: Date, to: Date) {
  const rows = await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(DISTINCT "userId")::int AS n
    FROM bookmarks
    WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
  `;
  return countDistinct(rows);
}

async function getNewUsersWithSaveIn24h(weekStart: Date) {
  const rows = await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM users u
    WHERE u."createdAt" >= ${weekStart}
      AND u.role = 'USER'
      AND EXISTS (
        SELECT 1 FROM bookmarks b
        WHERE b."userId" = u.id
          AND b."createdAt" >= u."createdAt"
          AND b."createdAt" < u."createdAt" + interval '1 day'
      )
  `;
  return countDistinct(rows);
}

async function retentionPct(cohortFrom: Date, cohortTo: Date, activityFrom: Date) {
  const rows = await prisma.$queryRaw<{ cohort: number; returned: number }[]>`
    WITH cohort AS (
      SELECT id FROM users
      WHERE "createdAt" >= ${cohortFrom}
        AND "createdAt" < ${cohortTo}
        AND role = 'USER'
    )
    SELECT
      (SELECT COUNT(*)::int FROM cohort) AS cohort,
      (
        SELECT COUNT(*)::int FROM cohort c
        WHERE EXISTS (
          SELECT 1 FROM bookmarks b
          WHERE b."userId" = c.id AND b."createdAt" >= ${activityFrom}
        )
      ) AS returned
  `;
  const cohort = Number(rows[0]?.cohort ?? 0);
  const returned = Number(rows[0]?.returned ?? 0);
  return cohort > 0 ? Math.round((returned / cohort) * 100) : 0;
}

async function getD1Retention(yesterdayStart: Date, todayStart: Date) {
  return retentionPct(yesterdayStart, todayStart, todayStart);
}

async function getD7Retention(eightDaysAgo: Date, weekStart: Date) {
  return retentionPct(eightDaysAgo, weekStart, weekStart);
}

async function getD30Retention(thirtyOneDaysAgo: Date, thirtyDaysStart: Date) {
  return retentionPct(thirtyOneDaysAgo, thirtyDaysStart, thirtyDaysStart);
}

async function getPulseScoreForPeriod(from: Date, to: Date): Promise<number> {
  const [saves, sugItems, sugLists, lists, totalUsers, returning] = await Promise.all([
    prisma.bookmarks.count({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.suggested_items.count({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.suggested_lists.count({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.lists.count({ where: { createdAt: { gte: from, lt: to }, isPublic: true } }),
    prisma.users.count({ where: { role: 'USER', isActive: true } }),
    getReturningUsersCount(from, to),
  ]);
  const suggestions = sugItems + sugLists;
  const retentionComponent =
    totalUsers > 0 ? Math.min(100, (returning / Math.max(1, totalUsers)) * 200) : 0;
  const pulseRaw =
    Math.min(100, (saves / 50) * 25) +
    Math.min(100, (suggestions / 20) * 25) +
    Math.min(100, (lists / 10) * 25) +
    Math.min(100, retentionComponent / 4);
  return Math.round(Math.min(100, pulseRaw));
}

function utcDayKeys(from: Date, to: Date): string[] {
  const out: string[] = [];
  const cur = new Date(from);
  let guard = 0;
  while (cur <= to && guard < 40) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
    guard += 1;
  }
  return out;
}

async function getActiveUsersLast30Days(
  from: Date,
  to: Date
): Promise<{ date: string; count: number }[]> {
  const rows = await prisma.$queryRaw<{ day: string; n: number }[]>`
    SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
      COUNT(DISTINCT "userId")::int AS n
    FROM bookmarks
    WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
    GROUP BY 1
  `;
  const byDay = new Map(rows.map((r) => [r.day, Number(r.n)]));
  return utcDayKeys(from, to).map((date) => ({ date, count: byDay.get(date) ?? 0 }));
}

async function getSavesVsListsLast30Days(
  from: Date,
  to: Date
): Promise<{ date: string; saves: number; lists: number }[]> {
  const [saves, lists] = await Promise.all([
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS n
      FROM bookmarks
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY 1
    `,
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS n
      FROM lists
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to} AND "isPublic" = true
      GROUP BY 1
    `,
  ]);
  const savesByDay = new Map(saves.map((r) => [r.day, Number(r.n)]));
  const listsByDay = new Map(lists.map((r) => [r.day, Number(r.n)]));
  return utcDayKeys(from, to).map((date) => ({
    date,
    saves: savesByDay.get(date) ?? 0,
    lists: listsByDay.get(date) ?? 0,
  }));
}

async function getSavesVsSuggestionsLast14(
  todayStart: Date
): Promise<{ date: string; saves: number; suggestions: number }[]> {
  const from = new Date(todayStart);
  from.setDate(from.getDate() - 13);
  const to = new Date(todayStart);
  to.setDate(to.getDate() + 1);
  const [saves, suggestions] = await Promise.all([
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS n
      FROM bookmarks
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY 1
    `,
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT day, COUNT(*)::int AS n FROM (
        SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day
        FROM suggested_items
        WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
        UNION ALL
        SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
        FROM suggested_lists
        WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
      ) s
      GROUP BY day
    `,
  ]);
  const savesByDay = new Map(saves.map((r) => [r.day, Number(r.n)]));
  const sugByDay = new Map(suggestions.map((r) => [r.day, Number(r.n)]));
  const end = new Date(todayStart);
  return utcDayKeys(from, end).map((date) => ({
    date,
    saves: savesByDay.get(date) ?? 0,
    suggestions: sugByDay.get(date) ?? 0,
  }));
}

async function getNewListsPerWeek(
  weeks: number
): Promise<{ weekLabel: string; count: number }[]> {
  const now = new Date();
  const windows = Array.from({ length: weeks }, (_, index) => {
    const w = weeks - 1 - index;
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    return { weekStart, weekEnd };
  });
  const counts = await Promise.all(
    windows.map(({ weekStart, weekEnd }) =>
      prisma.lists.count({
        where: { createdAt: { gte: weekStart, lt: weekEnd }, isPublic: true },
      })
    )
  );
  return windows.map(({ weekStart }, index) => ({
    weekLabel: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
    count: counts[index] ?? 0,
  }));
}

type KpiCard = {
  key: string;
  label: string;
  value: number;
  series7d: { date: string; value: number }[];
  growthPercent: number;
};

async function getKpiCardsSeries(
  weekStart: Date,
  twoWeeksStart: Date,
  _now: Date,
  todayStart: Date
): Promise<KpiCard[]> {
  const sevenStart = new Date(todayStart);
  sevenStart.setDate(sevenStart.getDate() - 6);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalUsers, dayBookmarks, daySuggestions, dayComments, weeks] = await Promise.all([
    prisma.users.count({ where: { role: 'USER', isActive: true } }),
    prisma.$queryRaw<{ day: string; saves: number; active: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS saves,
        COUNT(DISTINCT "userId")::int AS active
      FROM bookmarks
      WHERE "createdAt" >= ${sevenStart} AND "createdAt" < ${tomorrow}
      GROUP BY 1
    `,
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT day, COUNT(*)::int AS n FROM (
        SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day
        FROM suggested_items
        WHERE "createdAt" >= ${sevenStart} AND "createdAt" < ${tomorrow}
        UNION ALL
        SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
        FROM suggested_lists
        WHERE "createdAt" >= ${sevenStart} AND "createdAt" < ${tomorrow}
      ) s
      GROUP BY day
    `,
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS n
      FROM comments
      WHERE "createdAt" >= ${sevenStart}
        AND "createdAt" < ${tomorrow}
        AND "deletedAt" IS NULL
      GROUP BY 1
    `,
    prisma.$queryRaw<{
      active_this: number;
      active_last: number;
      saves_this: number;
      saves_last: number;
      sug_this: number;
      sug_last: number;
      com_this: number;
      com_last: number;
    }[]>`
      SELECT
        (SELECT COUNT(DISTINCT "userId")::int FROM bookmarks WHERE "createdAt" >= ${weekStart}) AS active_this,
        (SELECT COUNT(DISTINCT "userId")::int FROM bookmarks WHERE "createdAt" >= ${twoWeeksStart} AND "createdAt" < ${weekStart}) AS active_last,
        (SELECT COUNT(*)::int FROM bookmarks WHERE "createdAt" >= ${weekStart}) AS saves_this,
        (SELECT COUNT(*)::int FROM bookmarks WHERE "createdAt" >= ${twoWeeksStart} AND "createdAt" < ${weekStart}) AS saves_last,
        (
          (SELECT COUNT(*)::int FROM suggested_items WHERE "createdAt" >= ${weekStart})
          + (SELECT COUNT(*)::int FROM suggested_lists WHERE "createdAt" >= ${weekStart})
        ) AS sug_this,
        (
          (SELECT COUNT(*)::int FROM suggested_items WHERE "createdAt" >= ${twoWeeksStart} AND "createdAt" < ${weekStart})
          + (SELECT COUNT(*)::int FROM suggested_lists WHERE "createdAt" >= ${twoWeeksStart} AND "createdAt" < ${weekStart})
        ) AS sug_last,
        (SELECT COUNT(*)::int FROM comments WHERE "createdAt" >= ${weekStart} AND "deletedAt" IS NULL) AS com_this,
        (SELECT COUNT(*)::int FROM comments WHERE "createdAt" >= ${twoWeeksStart} AND "createdAt" < ${weekStart} AND "deletedAt" IS NULL) AS com_last
    `,
  ]);

  const savesByDay = new Map(dayBookmarks.map((r) => [r.day, r]));
  const sugByDay = new Map(daySuggestions.map((r) => [r.day, Number(r.n)]));
  const commentsByDay = new Map(dayComments.map((r) => [r.day, Number(r.n)]));
  const series7d = utcDayKeys(sevenStart, todayStart).map((date) => {
    const row = savesByDay.get(date);
    return {
      date,
      saves: Number(row?.saves ?? 0),
      suggestions: sugByDay.get(date) ?? 0,
      comments: commentsByDay.get(date) ?? 0,
      active: Number(row?.active ?? 0),
    };
  });

  const week = weeks[0];
  const thisWeekActive = Number(week?.active_this ?? 0);
  const lastWeekActive = Number(week?.active_last ?? 0);
  const savesThisWeek = Number(week?.saves_this ?? 0);
  const savesLastWeek = Number(week?.saves_last ?? 0);
  const suggestionsThisWeek = Number(week?.sug_this ?? 0);
  const suggestionsLastWeek = Number(week?.sug_last ?? 0);
  const commentsThisWeek = Number(week?.com_this ?? 0);
  const commentsLastWeek = Number(week?.com_last ?? 0);
  const weeklyEngagedPct = totalUsers > 0 ? (thisWeekActive / totalUsers) * 100 : 0;
  const weeklyEngagedPctLast = totalUsers > 0 ? (lastWeekActive / totalUsers) * 100 : 0;
  const growthEngaged = weeklyEngagedPctLast > 0 ? ((weeklyEngagedPct - weeklyEngagedPctLast) / weeklyEngagedPctLast) * 100 : 0;
  const savesPerUser = thisWeekActive > 0 ? savesThisWeek / thisWeekActive : 0;
  const savesPerUserLast = lastWeekActive > 0 ? savesLastWeek / lastWeekActive : 0;
  const growthSavesPerUser = savesPerUserLast > 0 ? ((savesPerUser - savesPerUserLast) / savesPerUserLast) * 100 : 0;
  const suggestionRate = totalUsers > 0 ? (suggestionsThisWeek / totalUsers) * 100 : 0;
  const suggestionRateLast = totalUsers > 0 ? (suggestionsLastWeek / totalUsers) * 100 : 0;
  const growthSuggestion = suggestionRateLast > 0 ? ((suggestionRate - suggestionRateLast) / suggestionRateLast) * 100 : 0;
  const commentRate = thisWeekActive > 0 ? (commentsThisWeek / thisWeekActive) * 100 : 0;
  const commentRateLast = lastWeekActive > 0 ? (commentsLastWeek / lastWeekActive) * 100 : 0;
  const growthComment = commentRateLast > 0 ? ((commentRate - commentRateLast) / commentRateLast) * 100 : 0;

  return [
    {
      key: 'weeklyEngagedUsersPct',
      label: 'کاربران فعال این هفته %',
      value: Math.round(weeklyEngagedPct * 10) / 10,
      series7d: series7d.map((s) => ({ date: s.date, value: s.active })),
      growthPercent: Math.round(growthEngaged),
    },
    {
      key: 'savesPerActiveUser',
      label: 'ذخیره به ازای هر کاربر فعال',
      value: Math.round(savesPerUser * 10) / 10,
      series7d: series7d.map((s) => ({ date: s.date, value: s.saves / Math.max(1, s.active) })),
      growthPercent: Math.round(growthSavesPerUser),
    },
    {
      key: 'suggestionRate',
      label: 'نرخ پیشنهاد (به ازای ۱۰۰ کاربر)',
      value: Math.round(suggestionRate * 10) / 10,
      series7d: series7d.map((s) => ({ date: s.date, value: s.suggestions })),
      growthPercent: Math.round(growthSuggestion),
    },
    {
      key: 'commentRate',
      label: 'نرخ کامنت (به ازای ۱۰۰ کاربر فعال)',
      value: Math.round(commentRate * 10) / 10,
      series7d: series7d.map((s) => ({ date: s.date, value: s.comments / Math.max(1, s.active) * 100 })),
      growthPercent: Math.round(growthComment),
    },
  ];
}

async function getTrendingItems(
  weekStart: Date,
  limit: number
): Promise<{ id: string; title: string; imageUrl: string | null; velocity: number; saveCount: number }[]> {
  const byItem = await prisma.$queryRaw<
    { itemId: string; votes: bigint }[]
  >`
    SELECT v."itemId" as "itemId", COUNT(*)::bigint as votes
    FROM item_votes v
    WHERE v."createdAt" >= ${weekStart}
    GROUP BY v."itemId"
    ORDER BY votes DESC
    LIMIT ${limit * 2}
  `.catch(() => []);
  if (byItem.length === 0) return [];
  const itemIds = byItem.map((r) => r.itemId);
  const items = await prisma.items.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, title: true, imageUrl: true, listId: true },
  });
  const listIds = [...new Set(items.map((i) => i.listId))];
  const lists = await prisma.lists.findMany({
    where: { id: { in: listIds } },
    select: { id: true, saveCount: true },
  });
  const listSaveMap = new Map(lists.map((l) => [l.id, l.saveCount]));
  const itemMap = new Map(items.map((i) => [i.id, i]));
  return byItem.slice(0, limit).map((r) => {
    const item = itemMap.get(r.itemId);
    const listSave = item ? listSaveMap.get(item.listId) ?? 0 : 0;
    return {
      id: r.itemId,
      title: item?.title ?? '-',
      imageUrl: item?.imageUrl ?? null,
      velocity: Number(r.votes),
      saveCount: listSave,
    };
  });
}

async function getFastestGrowingCategories(
  weekStart: Date,
  limit: number
): Promise<{ id: string; name: string; icon: string; slug: string; growth: number; savesThisWeek: number }[]> {
  const prevStart = new Date(weekStart);
  prevStart.setDate(prevStart.getDate() - 7);
  const [thisWeek, lastWeek] = await Promise.all([
    prisma.$queryRaw<
      { categoryId: string | null; count: bigint }[]
    >`
      SELECT l."categoryId" as "categoryId", COUNT(*)::bigint as count
      FROM bookmarks b
      JOIN lists l ON l.id = b."listId"
      WHERE b."createdAt" >= ${weekStart} AND l."categoryId" IS NOT NULL
      GROUP BY l."categoryId"
    `.catch(() => []),
    prisma.$queryRaw<
      { categoryId: string | null; count: bigint }[]
    >`
      SELECT l."categoryId" as "categoryId", COUNT(*)::bigint as count
      FROM bookmarks b
      JOIN lists l ON l.id = b."listId"
      WHERE b."createdAt" >= ${prevStart} AND b."createdAt" < ${weekStart}
        AND l."categoryId" IS NOT NULL
      GROUP BY l."categoryId"
    `.catch(() => []),
  ]);
  const lastMap = new Map(lastWeek.map((r) => [r.categoryId ?? '', Number(r.count)]));
  const withGrowth: { categoryId: string; thisCount: number; growth: number }[] = [];
  for (const r of thisWeek) {
    const cid = r.categoryId ?? '';
    if (!cid) continue;
    const thisCount = Number(r.count);
    const prevCount = lastMap.get(cid) ?? 0;
    const growth = prevCount > 0 ? Math.round(((thisCount - prevCount) / prevCount) * 100) : 100;
    withGrowth.push({ categoryId: cid, thisCount, growth });
  }
  withGrowth.sort((a, b) => b.growth - a.growth);
  const top = withGrowth.slice(0, limit);
  const cats = await prisma.categories.findMany({
    where: { id: { in: top.map((t) => t.categoryId) } },
    select: { id: true, name: true, icon: true, slug: true },
  });
  const catMap = new Map(cats.map((c) => [c.id, c]));
  return top.flatMap((t) => {
    const c = catMap.get(t.categoryId);
    if (!c) return [];
    return [{ ...c, growth: t.growth, savesThisWeek: t.thisCount }];
  });
}

async function getSuggestionPanelStats(): Promise<{
  pendingCount: number;
  approvalRate: number;
  avgApprovalTimeHours: number;
}> {
  const [items, lists] = await Promise.all([
    prisma.$queryRaw<{ pending: number; approved: number; total: number; avg_hours: number | null }[]>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
        COUNT(*)::int AS total,
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 3600) FILTER (WHERE status = 'approved') AS avg_hours
      FROM suggested_items
    `,
    prisma.$queryRaw<{ pending: number; approved: number; total: number; avg_hours: number | null }[]>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
        COUNT(*)::int AS total,
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 3600) FILTER (WHERE status = 'approved') AS avg_hours
      FROM suggested_lists
    `,
  ]);
  const pendingCount = Number(items[0]?.pending ?? 0) + Number(lists[0]?.pending ?? 0);
  const approved = Number(items[0]?.approved ?? 0) + Number(lists[0]?.approved ?? 0);
  const total = Number(items[0]?.total ?? 0) + Number(lists[0]?.total ?? 0);
  const itemHours = Number(items[0]?.avg_hours ?? 0) * Number(items[0]?.approved ?? 0);
  const listHours = Number(lists[0]?.avg_hours ?? 0) * Number(lists[0]?.approved ?? 0);
  const avgApprovalTimeHours = approved > 0 ? (itemHours + listHours) / approved : 0;
  return {
    pendingCount,
    approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    avgApprovalTimeHours: Math.round(avgApprovalTimeHours * 10) / 10,
  };
}

async function getCreatorStats(): Promise<{
  listsWith50PlusSaves: number;
  pctUsersWith2PlusLists: number;
}> {
  const [lists50, totalUsers, usersWith2Plus] = await Promise.all([
    prisma.lists.count({ where: { isPublic: true, saveCount: { gte: 50 } } }),
    prisma.users.count({ where: { role: 'USER' } }),
    prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM (
        SELECT "userId"
        FROM lists
        WHERE "isPublic" = true
        GROUP BY "userId"
        HAVING COUNT(*) >= 2
      ) creators
    `.then((rows) => Number(rows[0]?.n ?? 0)),
  ]);
  const pctUsersWith2PlusLists = totalUsers > 0 ? Math.round((usersWith2Plus / totalUsers) * 100) : 0;
  return { listsWith50PlusSaves: lists50, pctUsersWith2PlusLists };
}

async function getActivityFeed(
  limit: number
): Promise<{ type: string; userId: string; userName: string | null; targetTitle: string | null; createdAt: string }[]> {
  const [recentBookmarks, recentLists, recentApproved] = await Promise.all([
    prisma.bookmarks.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { userId: true, createdAt: true, listId: true },
    }),
    prisma.lists.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 2),
      select: { id: true, title: true, userId: true, createdAt: true },
    }),
    prisma.suggested_items.findMany({
      where: { status: 'approved' },
      orderBy: { updatedAt: 'desc' },
      take: Math.floor(limit / 3),
      select: { title: true, updatedAt: true },
    }),
  ]);
  const listIds = [...new Set(recentBookmarks.map((b) => b.listId))];
  const lists = await prisma.lists.findMany({
    where: { id: { in: listIds } },
    select: { id: true, title: true },
  });
  const listMap = new Map(lists.map((l) => [l.id, l]));
  const userIds = [
    ...new Set([
      ...recentBookmarks.map((b) => b.userId),
      ...recentLists.map((l) => l.userId),
    ]),
  ];
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const events: { type: string; userId: string; userName: string | null; targetTitle: string | null; createdAt: Date }[] = [];
  for (const b of recentBookmarks) {
    events.push({
      type: 'save',
      userId: b.userId,
      userName: userMap.get(b.userId) ?? null,
      targetTitle: listMap.get(b.listId)?.title ?? null,
      createdAt: b.createdAt,
    });
  }
  for (const l of recentLists) {
    events.push({
      type: 'list_created',
      userId: l.userId,
      userName: userMap.get(l.userId) ?? null,
      targetTitle: l.title,
      createdAt: l.createdAt,
    });
  }
  for (const s of recentApproved) {
    events.push({
      type: 'suggestion_approved',
      userId: '',
      userName: null,
      targetTitle: s.title,
      createdAt: s.updatedAt,
    });
  }
  events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return events.slice(0, limit).map((e) => ({
    type: e.type,
    userId: e.userId,
    userName: e.userName,
    targetTitle: e.targetTitle,
    createdAt: e.createdAt.toISOString(),
  }));
}

async function getTopListsThisWeek(
  weekStart: Date,
  limit: number
): Promise<{ id: string; title: string; slug: string; saves: number }[]> {
  const rows = await prisma.$queryRaw<
    { listId: string; saves: bigint }[]
  >`
    SELECT b."listId" as "listId", COUNT(*)::bigint as saves
    FROM bookmarks b
    WHERE b."createdAt" >= ${weekStart}
    GROUP BY b."listId"
    ORDER BY saves DESC
    LIMIT ${limit}
  `.catch(() => []);
  if (rows.length === 0) return [];
  const listIds = rows.map((r) => r.listId);
  const lists = await prisma.lists.findMany({
    where: { id: { in: listIds } },
    select: { id: true, title: true, slug: true },
  });
  const map = new Map(lists.map((l) => [l.id, l]));
  return rows.map((r) => ({
    id: r.listId,
    title: map.get(r.listId)?.title ?? '-',
    slug: map.get(r.listId)?.slug ?? '',
    saves: Number(r.saves),
  }));
}

async function getTopItemsByVelocity(
  weekStart: Date,
  limit: number
): Promise<{ id: string; title: string; votes: number }[]> {
  const rows = await prisma.$queryRaw<
    { itemId: string; votes: bigint }[]
  >`
    SELECT v."itemId" as "itemId", COUNT(*)::bigint as votes
    FROM item_votes v
    WHERE v."createdAt" >= ${weekStart}
    GROUP BY v."itemId"
    ORDER BY votes DESC
    LIMIT ${limit}
  `.catch(() => []);
  if (rows.length === 0) return [];
  const itemIds = rows.map((r) => r.itemId);
  const items = await prisma.items.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, title: true },
  });
  const map = new Map(items.map((i) => [i.id, i]));
  return rows.map((r) => ({
    id: r.itemId,
    title: map.get(r.itemId)?.title ?? '-',
    votes: Number(r.votes),
  }));
}

async function getTopCreatorsByActivity(
  limit: number
): Promise<{ userId: string; name: string | null; saves: number; lists: number }[]> {
  const top = await prisma.$queryRaw<
    { userId: string; saves: number; lists: number }[]
  >`
    SELECT ranked."userId" AS "userId", ranked.saves, ranked.lists
    FROM (
      SELECT
        u."userId",
        COALESCE(s.saves, 0)::int AS saves,
        COALESCE(l.lists, 0)::int AS lists
      FROM (
        SELECT "userId" FROM bookmarks
        UNION
        SELECT "userId" FROM lists WHERE "isPublic" = true
      ) u
      LEFT JOIN (
        SELECT "userId", COUNT(*)::int AS saves FROM bookmarks GROUP BY "userId"
      ) s ON s."userId" = u."userId"
      LEFT JOIN (
        SELECT "userId", COUNT(*)::int AS lists
        FROM lists
        WHERE "isPublic" = true
        GROUP BY "userId"
      ) l ON l."userId" = u."userId"
      ORDER BY (COALESCE(s.saves, 0) + COALESCE(l.lists, 0) * 5) DESC
      LIMIT ${limit}
    ) ranked
  `;
  if (top.length === 0) return [];
  const users = await prisma.users.findMany({
    where: { id: { in: top.map((t) => t.userId) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  return top.map((t) => ({
    userId: t.userId,
    name: userMap.get(t.userId) ?? null,
    saves: Number(t.saves),
    lists: Number(t.lists),
  }));
}
