import { NextResponse } from 'next/server';
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

    const data = await dbQuery(async () => {
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

      // ——— Section 1: وضعیت کلی ———
      const [activeUsersToday, savesToday, newListsToday, pendingItems, pendingLists] =
        await Promise.all([
          getActiveUsersCount(todayStart),
          prisma.bookmarks.count({ where: { createdAt: { gte: todayStart } } }),
          prisma.lists.count({
            where: { createdAt: { gte: todayStart }, isPublic: true },
          }),
          prisma.suggested_items.count({ where: { status: 'pending' } }),
          prisma.suggested_lists.count({ where: { status: 'pending' } }),
        ]);
      const suggestionsPending = pendingItems + pendingLists;

      // ——— Engagement (۷ روز) برای نمره ———
      const [savesWeek, sugWeekItems, sugWeekLists, commentsWeek, listsCreatedWeek] =
        await Promise.all([
          prisma.bookmarks.count({ where: { createdAt: { gte: weekStart } } }),
          prisma.suggested_items.count({ where: { createdAt: { gte: weekStart } } }),
          prisma.suggested_lists.count({ where: { createdAt: { gte: weekStart } } }),
          prisma.comments.count({
            where: { createdAt: { gte: weekStart }, deletedAt: null },
          }),
          prisma.lists.count({
            where: { createdAt: { gte: weekStart }, isPublic: true },
          }),
        ]);
      const suggestionsWeek = sugWeekItems + sugWeekLists;

      // Engagement Score: (Save*1 + Suggestion*2 + Comment*1.5) → 0–100
      const engagementRaw =
        savesWeek * 1 + suggestionsWeek * 2 + commentsWeek * 1.5;
      const engagementTarget = 200;
      const engagementScore = Math.min(
        100,
        Math.round((engagementRaw / engagementTarget) * 100)
      );

      // ——— Pulse Score (ترکیب Save, Suggest, List, Retention) ———
      const totalUsers = await prisma.users.count({
        where: { role: 'USER', isActive: true },
      });
      const returningUsersWeek = await getReturningUsersCount(weekStart, now);
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

      // ——— Activation ———
      const newUsersLast7 = await prisma.users.count({
        where: { createdAt: { gte: weekStart }, role: 'USER' },
      });
      const newUsersWithFirstSave = await getNewUsersWithSaveIn24h(weekStart);
      const activationPct =
        newUsersLast7 > 0
          ? Math.round((newUsersWithFirstSave / newUsersLast7) * 100)
          : 0;

      // ——— Retention ———
      const [d1Retention, d7Retention, d30Retention] = await Promise.all([
        getD1Retention(yesterdayStart, todayStart),
        getD7Retention(eightDaysAgo, weekStart),
        getD30Retention(thirtyOneDaysAgo, thirtyDaysStart),
      ]);

      // ——— Pulse هفته قبل (برای تغییر هفتگی) ———
      const pulseScoreLastWeek = await getPulseScoreForPeriod(twoWeeksStart, weekStart);
      const pulseScoreWeeklyChange = pulseScore - pulseScoreLastWeek;
      const pulseStatus: 'up' | 'down' | 'stable' =
        pulseScoreWeeklyChange > 0 ? 'up' : pulseScoreWeeklyChange < 0 ? 'down' : 'stable';

      // ——— کاربران فعال و لیست‌های جدید ۷ روز (برای KPI row) ———
      const activeUsers7d = await getActiveUsersCount(weekStart);

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

      // ——— Top Movers ———
      const [topListsWeek, topItemsByVotes, fastestCategory] =
        await Promise.all([
          getTopListsThisWeek(weekStart, 5),
          getTopItemsByVelocity(weekStart, 5),
          getFastestGrowingCategory(weekStart),
        ]);

      // ——— Creator Spotlight ———
      const [topListsBySave, topCreators] = await Promise.all([
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

      // Suggestion quality
      const [approvedItems, approvedLists, totalItems, totalLists] = await Promise.all([
        prisma.suggested_items.count({ where: { status: 'approved' } }),
        prisma.suggested_lists.count({ where: { status: 'approved' } }),
        prisma.suggested_items.count(),
        prisma.suggested_lists.count(),
      ]);
      const approvedSuggestions = approvedItems + approvedLists;
      const totalSuggestions = totalItems + totalLists;
      const suggestionQualityRate =
        totalSuggestions > 0
          ? Math.round((approvedSuggestions / totalSuggestions) * 100)
          : 0;

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
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('KPI growth error:', err);
    return NextResponse.json(
      { error: 'خطا در محاسبه KPI' },
      { status: 500 }
    );
  }
}

async function getActiveUsersCount(since: Date) {
  const [b, c, v, l] = await Promise.all([
    prisma.bookmarks.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
    }),
    prisma.comments.findMany({
      where: { createdAt: { gte: since }, deletedAt: null },
      select: { userId: true },
    }),
    prisma.item_votes.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
    }),
    prisma.lists.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
    }),
  ]);
  const set = new Set([
    ...b.map((x) => x.userId),
    ...c.map((x) => x.userId),
    ...v.map((x) => x.userId),
    ...l.map((x) => x.userId),
  ]);
  return set.size;
}

async function getReturningUsersCount(from: Date, to: Date) {
  const bookmarks = await prisma.bookmarks.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { userId: true },
  });
  return new Set(bookmarks.map((b) => b.userId)).size;
}

async function getNewUsersWithSaveIn24h(weekStart: Date) {
  const users = await prisma.users.findMany({
    where: { createdAt: { gte: weekStart }, role: 'USER' },
    select: { id: true, createdAt: true },
  });
  let count = 0;
  for (const u of users) {
    const dayEnd = new Date(u.createdAt);
    dayEnd.setHours(24, 0, 0, 0);
    const firstSave = await prisma.bookmarks.findFirst({
      where: {
        userId: u.id,
        createdAt: { gte: u.createdAt, lte: dayEnd },
      },
    });
    if (firstSave) count++;
  }
  return count;
}

async function getD1Retention(yesterdayStart: Date, todayStart: Date) {
  const cohort = await prisma.users.findMany({
    where: {
      createdAt: { gte: yesterdayStart, lt: todayStart },
      role: 'USER',
    },
    select: { id: true },
  });
  if (cohort.length === 0) return 0;
  let returned = 0;
  for (const u of cohort) {
    const any = await prisma.bookmarks.findFirst({
      where: { userId: u.id, createdAt: { gte: todayStart } },
    });
    if (any) returned++;
  }
  return Math.round((returned / cohort.length) * 100);
}

async function getD7Retention(eightDaysAgo: Date, weekStart: Date) {
  const cohort = await prisma.users.findMany({
    where: {
      createdAt: { gte: eightDaysAgo, lt: weekStart },
      role: 'USER',
    },
    select: { id: true },
  });
  if (cohort.length === 0) return 0;
  let returned = 0;
  for (const u of cohort) {
    const any = await prisma.bookmarks.findFirst({
      where: {
        userId: u.id,
        createdAt: { gte: weekStart },
      },
    });
    if (any) returned++;
  }
  return cohort.length > 0 ? Math.round((returned / cohort.length) * 100) : 0;
}

async function getD30Retention(thirtyOneDaysAgo: Date, thirtyDaysStart: Date) {
  const cohort = await prisma.users.findMany({
    where: {
      createdAt: { gte: thirtyOneDaysAgo, lt: thirtyDaysStart },
      role: 'USER',
    },
    select: { id: true },
  });
  if (cohort.length === 0) return 0;
  let returned = 0;
  for (const u of cohort) {
    const any = await prisma.bookmarks.findFirst({
      where: { userId: u.id, createdAt: { gte: thirtyDaysStart } },
    });
    if (any) returned++;
  }
  return cohort.length > 0 ? Math.round((returned / cohort.length) * 100) : 0;
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

async function getActiveUsersLast30Days(
  from: Date,
  to: Date
): Promise<{ date: string; count: number }[]> {
  const bookmarks = await prisma.bookmarks.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { userId: true, createdAt: true },
  });
  const byDay = new Map<string, Set<string>>();
  for (const b of bookmarks) {
    const d = b.createdAt.toISOString().slice(0, 10);
    if (!byDay.has(d)) byDay.set(d, new Set());
    byDay.get(d)!.add(b.userId);
  }
  const out: { date: string; count: number }[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    const d = cur.toISOString().slice(0, 10);
    out.push({ date: d, count: byDay.get(d)?.size ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

async function getSavesVsListsLast30Days(
  from: Date,
  to: Date
): Promise<{ date: string; saves: number; lists: number }[]> {
  const [bookmarks, listsCreated] = await Promise.all([
    prisma.bookmarks.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    }),
    prisma.lists.findMany({
      where: { createdAt: { gte: from, lte: to }, isPublic: true },
      select: { createdAt: true },
    }),
  ]);
  const savesByDay = new Map<string, number>();
  const listsByDay = new Map<string, number>();
  for (const b of bookmarks) {
    const d = b.createdAt.toISOString().slice(0, 10);
    savesByDay.set(d, (savesByDay.get(d) ?? 0) + 1);
  }
  for (const l of listsCreated) {
    const d = l.createdAt.toISOString().slice(0, 10);
    listsByDay.set(d, (listsByDay.get(d) ?? 0) + 1);
  }
  const out: { date: string; saves: number; lists: number }[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    const d = cur.toISOString().slice(0, 10);
    out.push({
      date: d,
      saves: savesByDay.get(d) ?? 0,
      lists: listsByDay.get(d) ?? 0,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

async function getSavesVsSuggestionsLast14(
  todayStart: Date
): Promise<{ date: string; saves: number; suggestions: number }[]> {
  const days: { date: string; saves: number; suggestions: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [saves, sugItems, sugLists] = await Promise.all([
      prisma.bookmarks.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.suggested_items.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.suggested_lists.count({ where: { createdAt: { gte: start, lt: end } } }),
    ]);
    const suggestions = sugItems + sugLists;
    days.push({ date: start.toISOString().slice(0, 10), saves, suggestions });
  }
  return days;
}

async function getNewListsPerWeek(
  weeks: number
): Promise<{ weekLabel: string; count: number }[]> {
  const result: { weekLabel: string; count: number }[] = [];
  const now = new Date();
  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    const count = await prisma.lists.count({
      where: {
        createdAt: { gte: weekStart, lt: weekEnd },
        isPublic: true,
      },
    });
    result.push({
      weekLabel: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      count,
    });
  }
  return result;
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
  now: Date,
  todayStart: Date
): Promise<KpiCard[]> {
  const totalUsers = await prisma.users.count({ where: { role: 'USER', isActive: true } });
  const series7d: { date: string; saves: number; suggestions: number; comments: number; active: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [saves, sugItems, sugLists, comments, bookmarks] = await Promise.all([
      prisma.bookmarks.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.suggested_items.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.suggested_lists.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.comments.count({ where: { createdAt: { gte: start, lt: end }, deletedAt: null } }),
      prisma.bookmarks.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { userId: true } }),
    ]);
    const suggestions = sugItems + sugLists;
    const active = new Set(bookmarks.map((b) => b.userId)).size;
    series7d.push({
      date: start.toISOString().slice(0, 10),
      saves,
      suggestions,
      comments,
      active,
    });
  }
  const thisWeekActive = new Set(
    (
      await prisma.bookmarks.findMany({
        where: { createdAt: { gte: weekStart } },
        select: { userId: true },
      })
    ).map((b) => b.userId)
  ).size;
  const lastWeekActive = new Set(
    (
      await prisma.bookmarks.findMany({
        where: { createdAt: { gte: twoWeeksStart, lt: weekStart } },
        select: { userId: true },
      })
    ).map((b) => b.userId)
  ).size;
  const [
    savesThisWeek,
    savesLastWeek,
    sugThisItems,
    sugThisLists,
    sugLastItems,
    sugLastLists,
    commentsThisWeek,
    commentsLastWeek,
  ] = await Promise.all([
    prisma.bookmarks.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.bookmarks.count({ where: { createdAt: { gte: twoWeeksStart, lt: weekStart } } }),
    prisma.suggested_items.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.suggested_lists.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.suggested_items.count({ where: { createdAt: { gte: twoWeeksStart, lt: weekStart } } }),
    prisma.suggested_lists.count({ where: { createdAt: { gte: twoWeeksStart, lt: weekStart } } }),
    prisma.comments.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
    prisma.comments.count({ where: { createdAt: { gte: twoWeeksStart, lt: weekStart }, deletedAt: null } }),
  ]);
  const suggestionsThisWeek = sugThisItems + sugThisLists;
  const suggestionsLastWeek = sugLastItems + sugLastLists;
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
  return top.map((t) => {
    const c = catMap.get(t.categoryId)!;
    return { ...c, growth: t.growth, savesThisWeek: t.thisCount };
  });
}

async function getSuggestionPanelStats(): Promise<{
  pendingCount: number;
  approvalRate: number;
  avgApprovalTimeHours: number;
}> {
  const [pendingItems, pendingLists, approvedItems, approvedLists, totalItems, totalLists] =
    await Promise.all([
      prisma.suggested_items.count({ where: { status: 'pending' } }),
      prisma.suggested_lists.count({ where: { status: 'pending' } }),
      prisma.suggested_items.findMany({ where: { status: 'approved' }, select: { createdAt: true, updatedAt: true } }),
      prisma.suggested_lists.findMany({ where: { status: 'approved' }, select: { createdAt: true, updatedAt: true } }),
      prisma.suggested_items.count(),
      prisma.suggested_lists.count(),
    ]);
  const pendingCount = pendingItems + pendingLists;
  const total = totalItems + totalLists;
  const approvalRate = total > 0 ? Math.round(((approvedItems.length + approvedLists.length) / total) * 100) : 0;
  const allApproved = [
    ...approvedItems.map((x) => (x.updatedAt.getTime() - x.createdAt.getTime()) / (1000 * 60 * 60)),
    ...approvedLists.map((x) => (x.updatedAt.getTime() - x.createdAt.getTime()) / (1000 * 60 * 60)),
  ];
  const avgApprovalTimeHours = allApproved.length > 0 ? allApproved.reduce((a, b) => a + b, 0) / allApproved.length : 0;
  return { pendingCount, approvalRate, avgApprovalTimeHours: Math.round(avgApprovalTimeHours * 10) / 10 };
}

async function getCreatorStats(): Promise<{
  listsWith50PlusSaves: number;
  pctUsersWith2PlusLists: number;
}> {
  const [lists50, totalUsers, usersWith2Plus] = await Promise.all([
    prisma.lists.count({ where: { isPublic: true, saveCount: { gte: 50 } } }),
    prisma.users.count({ where: { role: 'USER' } }),
    prisma.lists.groupBy({ by: ['userId'], where: { isPublic: true }, _count: { id: true } }).then((groups) =>
      groups.filter((g) => g._count.id >= 2).length
    ),
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

async function getFastestGrowingCategory(weekStart: Date): Promise<{
  id: string;
  name: string;
  icon: string;
  slug: string;
  growth: number;
} | null> {
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
  const lastMap = new Map(
    lastWeek.map((r) => [r.categoryId ?? '', Number(r.count)])
  );
  let best: { id: string; name: string; icon: string; slug: string; growth: number } | null = null;
  for (const r of thisWeek) {
    const cid = r.categoryId ?? '';
    if (!cid) continue;
    const thisCount = Number(r.count);
    const prevCount = lastMap.get(cid) ?? 0;
    const growth = prevCount > 0 ? Math.round(((thisCount - prevCount) / prevCount) * 100) : 100;
    if (!best || growth > best.growth) {
      const cat = await prisma.categories.findUnique({
        where: { id: cid },
        select: { id: true, name: true, icon: true, slug: true },
      });
      if (cat) best = { ...cat, growth };
    }
  }
  return best;
}

async function getTopCreatorsByActivity(
  limit: number
): Promise<{ userId: string; name: string | null; saves: number; lists: number }[]> {
  const savesByUser = await prisma.$queryRaw<
    { userId: string; saves: bigint }[]
  >`
    SELECT "userId", COUNT(*)::bigint as saves
    FROM bookmarks
    GROUP BY "userId"
  `.catch(() => []);
  const listsByUser = await prisma.lists.groupBy({
    by: ['userId'],
    where: { isPublic: true },
    _count: { id: true },
  });
  const listMap = new Map(listsByUser.map((l) => [l.userId, l._count.id]));
  const combined = savesByUser.map((r) => ({
    userId: r.userId,
    saves: Number(r.saves),
    lists: listMap.get(r.userId) ?? 0,
  }));
  combined.sort((a, b) => b.saves + b.lists * 5 - (a.saves + a.lists * 5));
  const top = combined.slice(0, limit);
  const users = await prisma.users.findMany({
    where: { id: { in: top.map((t) => t.userId) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  return top.map((t) => ({
    userId: t.userId,
    name: userMap.get(t.userId) ?? null,
    saves: t.saves,
    lists: t.lists,
  }));
}
