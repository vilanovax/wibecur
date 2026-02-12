import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

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

    const [
      todaySaves,
      todayComments,
      newUsersToday,
      todayItemVotes,
      bookmarksByDay,
      commentsByDay,
      usersByDay,
    ] = await Promise.all([
      prisma.bookmarks.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.comments.count({
        where: { createdAt: { gte: todayStart }, deletedAt: null },
      }),
      prisma.users.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.item_votes.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT (b."createdAt"::date) as day, COUNT(*)::bigint as count
        FROM bookmarks b
        WHERE b."createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY (b."createdAt"::date)
        ORDER BY day ASC
      `.catch(() => []),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT (c."createdAt"::date) as day, COUNT(*)::bigint as count
        FROM comments c
        WHERE c."createdAt" >= NOW() - INTERVAL '7 days' AND c."deletedAt" IS NULL
        GROUP BY (c."createdAt"::date)
        ORDER BY day ASC
      `.catch(() => []),
      prisma.$queryRaw<
        { day: Date; count: bigint }[]
      >`
        SELECT (u."createdAt"::date) as day, COUNT(*)::bigint as count
        FROM users u
        WHERE u."createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY (u."createdAt"::date)
        ORDER BY day ASC
      `.catch(() => []),
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

    const days: { date: string; saves: number; comments: number; newUsers: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const saves =
        Number(bookmarksByDay.find((r) => String(r.day).slice(0, 10) === dateStr)?.count ?? 0);
      const comments =
        Number(commentsByDay.find((r) => String(r.day).slice(0, 10) === dateStr)?.count ?? 0);
      const newUsers =
        Number(usersByDay.find((r) => String(r.day).slice(0, 10) === dateStr)?.count ?? 0);
      days.push({ date: dateStr, saves, comments, newUsers });
    }

    return {
      todaySaves,
      todayComments,
      activeUsersToday,
      newUsersToday,
      todayInteractions,
      dailyStats: days,
    };
  });
}

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
