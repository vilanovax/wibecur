import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';

const CACHE_SECONDS = 120; // 2 min

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function getPulseOverview() {
  return dbQuery(async () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [
      todaySaves,
      todayComments,
      newUsersToday,
      todayItemVotes,
      yesterdaySaves,
      yesterdayComments,
      newUsersYesterday,
      todayLists,
      pendingItemReports,
      pendingCommentReports,
      bookmarksByDay,
      commentsByDay,
      usersByDay,
      listsByDay,
      yesterdayLists,
    ] = await Promise.all([
      prisma.bookmarks.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.comments.count({
        where: { createdAt: { gte: todayStart }, deletedAt: null },
      }),
      prisma.users.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.item_votes.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.bookmarks.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.comments.count({
        where: { createdAt: { gte: yesterdayStart, lt: todayStart }, deletedAt: null },
      }),
      prisma.users.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.lists.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.item_reports.count({ where: { resolved: false } }),
      prisma.comment_reports.count({ where: { resolved: false } }),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT (b."createdAt"::date) as day, COUNT(*)::bigint as count
        FROM bookmarks b
        WHERE b."createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY (b."createdAt"::date)
        ORDER BY day ASC
      `.catch(() => []),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT (c."createdAt"::date) as day, COUNT(*)::bigint as count
        FROM comments c
        WHERE c."createdAt" >= NOW() - INTERVAL '14 days' AND c."deletedAt" IS NULL
        GROUP BY (c."createdAt"::date)
        ORDER BY day ASC
      `.catch(() => []),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT (u."createdAt"::date) as day, COUNT(*)::bigint as count
        FROM users u
        WHERE u."createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY (u."createdAt"::date)
        ORDER BY day ASC
      `.catch(() => []),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT (l."createdAt"::date) as day, COUNT(*)::bigint as count
        FROM lists l
        WHERE l."createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY (l."createdAt"::date)
        ORDER BY day ASC
      `.catch(() => []),
      prisma.lists.count({
        where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
    ]);

    const [bookmarksToday, commentsToday, votesToday] = await Promise.all([
      prisma.bookmarks.findMany({ where: { createdAt: { gte: todayStart } }, select: { userId: true } }),
      prisma.comments.findMany({ where: { createdAt: { gte: todayStart }, deletedAt: null }, select: { userId: true } }),
      prisma.item_votes.findMany({ where: { createdAt: { gte: todayStart } }, select: { userId: true } }),
    ]);
    const activeUserIds = new Set([
      ...bookmarksToday.map((b) => b.userId),
      ...commentsToday.map((c) => c.userId),
      ...votesToday.map((v) => v.userId),
    ]);
    const activeUsersToday = activeUserIds.size;

    const todayInteractions =
      todaySaves + todayComments + newUsersToday + todayItemVotes;

    const days: { date: string; saves: number; comments: number; newUsers: number; lists: number }[] =
      [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const saves =
        Number(bookmarksByDay.find((r) => String(r.day).slice(0, 10) === dateStr)?.count ?? 0);
      const comments =
        Number(commentsByDay.find((r) => String(r.day).slice(0, 10) === dateStr)?.count ?? 0);
      const newUsers =
        Number(usersByDay.find((r) => String(r.day).slice(0, 10) === dateStr)?.count ?? 0);
      const lists =
        Number(listsByDay.find((r) => String(r.day).slice(0, 10) === dateStr)?.count ?? 0);
      days.push({ date: dateStr, saves, comments, newUsers, lists });
    }

    const saveCounts = days.map((d) => d.saves);
    const saveAvg = saveCounts.reduce((a, b) => a + b, 0) / (saveCounts.length || 1);
    const saveSpikes =
      saveAvg > 0
        ? saveCounts.filter((s) => s >= Math.max(5, Math.ceil(saveAvg * 2))).length
        : 0;

    return {
      todaySaves,
      todayComments,
      activeUsersToday,
      newUsersToday,
      todayInteractions,
      todayLists,
      yesterdaySaves,
      yesterdayComments,
      newUsersYesterday,
      yesterdayLists,
      dailyStats: days,
      risk: {
        reportsPending: pendingItemReports + pendingCommentReports,
        commentReportsPending: pendingCommentReports,
        itemReportsPending: pendingItemReports,
        suspiciousLists: 0,
        saveSpikes,
      },
      chartStats: days.slice(-7),
      lastSync: new Date().toISOString(),
    };
  });
}

export async function GET() {
  try {
    const userOrRes = await requirePermission('view_pulse');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const getCached = unstable_cache(
      getPulseOverview,
      ['admin-pulse-overview'],
      { revalidate: CACHE_SECONDS, tags: ['admin-pulse'] }
    );
    const data = await getCached();

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Pulse overview error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت خلاصه' },
      { status: 500 }
    );
  }
}
