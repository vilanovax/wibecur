import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

const CACHE_SECONDS = 120;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function getSuggestionHealth() {
  return dbQuery(async () => {
    const todayStart = startOfDay(new Date());

    const [pendingItems, approvedTodayItems, rejectedTodayItems, pendingLists, approvedTodayLists, rejectedTodayLists] =
      await Promise.all([
        prisma.suggested_items.count({ where: { status: 'pending' } }),
        prisma.suggested_items.count({
          where: { status: 'approved', updatedAt: { gte: todayStart } },
        }),
        prisma.suggested_items.count({
          where: { status: 'rejected', updatedAt: { gte: todayStart } },
        }),
        prisma.suggested_lists.count({ where: { status: 'pending' } }),
        prisma.suggested_lists.count({
          where: { status: 'approved', updatedAt: { gte: todayStart } },
        }),
        prisma.suggested_lists.count({
          where: { status: 'rejected', updatedAt: { gte: todayStart } },
        }),
      ]);

    return {
      pendingItems,
      approvedTodayItems,
      rejectedTodayItems,
      pendingLists,
      approvedTodayLists,
      rejectedTodayLists,
      pendingTotal: pendingItems + pendingLists,
      approvedToday: approvedTodayItems + approvedTodayLists,
      rejectedToday: rejectedTodayItems + rejectedTodayLists,
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
      getSuggestionHealth,
      ['admin-pulse-suggestions'],
      { revalidate: CACHE_SECONDS, tags: ['admin-pulse'] }
    );
    const data = await getCached();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Pulse suggestions error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت وضعیت پیشنهادها' },
      { status: 500 }
    );
  }
}
