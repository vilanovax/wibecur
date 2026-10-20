import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';

const CACHE_SECONDS = 120; // 2 min

const TEHRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;

/** نیمه‌شب تقویم تهران، به‌صورت UTC. ایران ساعت تابستانی ندارد. */
function tehranDayStart(dayOffset: number) {
  const tehranNow = new Date(Date.now() + TEHRAN_OFFSET_MS);
  return new Date(
    Date.UTC(
      tehranNow.getUTCFullYear(),
      tehranNow.getUTCMonth(),
      tehranNow.getUTCDate() + dayOffset
    ) - TEHRAN_OFFSET_MS
  );
}

function tehranDateKey(dayOffset: number) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(
    new Date(tehranDayStart(dayOffset).getTime() + 60 * 60 * 1000)
  );
}

async function getPulseOverview() {
  return dbQuery(async () => {
    const todayStart = tehranDayStart(0);
    const yesterdayStart = tehranDayStart(-1);

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
      activeUsersRows,
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
        SELECT to_char(timezone('Asia/Tehran', b."createdAt"), 'YYYY-MM-DD') as day,
               COUNT(*)::bigint as count
        FROM bookmarks b
        WHERE b."createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY 1
        ORDER BY day ASC
      `.catch(() => []),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT to_char(timezone('Asia/Tehran', c."createdAt"), 'YYYY-MM-DD') as day,
               COUNT(*)::bigint as count
        FROM comments c
        WHERE c."createdAt" >= NOW() - INTERVAL '14 days' AND c."deletedAt" IS NULL
        GROUP BY 1
        ORDER BY day ASC
      `.catch(() => []),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT to_char(timezone('Asia/Tehran', u."createdAt"), 'YYYY-MM-DD') as day,
               COUNT(*)::bigint as count
        FROM users u
        WHERE u."createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY 1
        ORDER BY day ASC
      `.catch(() => []),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT to_char(timezone('Asia/Tehran', l."createdAt"), 'YYYY-MM-DD') as day,
               COUNT(*)::bigint as count
        FROM lists l
        WHERE l."createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY 1
        ORDER BY day ASC
      `.catch(() => []),
      prisma.lists.count({
        where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM (
          SELECT "userId" FROM bookmarks WHERE "createdAt" >= ${todayStart}
          UNION
          SELECT "userId" FROM comments
          WHERE "createdAt" >= ${todayStart} AND "deletedAt" IS NULL
          UNION
          SELECT "userId" FROM item_votes WHERE "createdAt" >= ${todayStart}
        ) u
      `,
    ]);

    const activeUsersToday = Number(activeUsersRows[0]?.n ?? 0);

    const todayInteractions =
      todaySaves + todayComments + newUsersToday + todayItemVotes;

    const days: { date: string; saves: number; comments: number; newUsers: number; lists: number }[] =
      [];
    const dayCount = (rows: { day: Date | string; count: bigint }[], key: string) =>
      Number(rows.find((r) => String(r.day).slice(0, 10) === key)?.count ?? 0);
    for (let i = 13; i >= 0; i--) {
      const dateStr = tehranDateKey(-i);
      const saves = dayCount(bookmarksByDay, dateStr);
      const comments = dayCount(commentsByDay, dateStr);
      const newUsers = dayCount(usersByDay, dateStr);
      const lists = dayCount(listsByDay, dateStr);
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

export function getCachedPulseOverview() {
  return unstable_cache(getPulseOverview, ['admin-pulse-overview-v3'], {
    revalidate: CACHE_SECONDS,
    tags: ['admin-pulse'],
  })();
}

export async function GET() {
  try {
    const userOrRes = await requirePermission('view_pulse');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const data = await getCachedPulseOverview();

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Pulse overview error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت خلاصه' },
      { status: 500 }
    );
  }
}
