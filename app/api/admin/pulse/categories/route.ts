import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

const CACHE_SECONDS = 180;

function getWeekRange(offset: number) {
  const end = new Date();
  end.setDate(end.getDate() - offset * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

async function getPulseCategories() {
  return dbQuery(async () => {
    const thisWeek = getWeekRange(0);
    const lastWeek = getWeekRange(1);

    const categories = await prisma.categories.findMany({
      where: { isActive: true },
      select: { id: true, name: true, icon: true, slug: true },
    });

    const lists = await prisma.lists.findMany({
      where: { categoryId: { in: categories.map((c) => c.id) } },
      select: { id: true, categoryId: true },
    });

    const listIdsByCategory = new Map<string, string[]>();
    lists.forEach((l) => {
      if (l.categoryId) {
        const arr = listIdsByCategory.get(l.categoryId) ?? [];
        arr.push(l.id);
        listIdsByCategory.set(l.categoryId, arr);
      }
    });

    const result: { id: string; name: string; icon: string; slug: string; growthPercent: number; activeListsCount: number }[] = [];
    for (const cat of categories) {
      const listIds = listIdsByCategory.get(cat.id) ?? [];
      if (listIds.length === 0) {
        result.push({ ...cat, growthPercent: 0, activeListsCount: 0 });
        continue;
      }
      const [thisW, lastW] = await Promise.all([
        prisma.bookmarks.count({
          where: {
            listId: { in: listIds },
            createdAt: { gte: thisWeek.start, lt: thisWeek.end },
          },
        }),
        prisma.bookmarks.count({
          where: {
            listId: { in: listIds },
            createdAt: { gte: lastWeek.start, lt: lastWeek.end },
          },
        }),
      ]);
      const growthPercent = lastW === 0 ? (thisW > 0 ? 100 : 0) : Math.round(((thisW - lastW) / lastW) * 100);
      result.push({ ...cat, growthPercent, activeListsCount: listIds.length });
    }

    return result.sort((a, b) => b.growthPercent - a.growthPercent);
  });
}

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const getCached = unstable_cache(
      getPulseCategories,
      ['admin-pulse-categories'],
      { revalidate: CACHE_SECONDS, tags: ['admin-pulse'] }
    );
    const data = await getCached();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Pulse categories error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌ها' },
      { status: 500 }
    );
  }
}
