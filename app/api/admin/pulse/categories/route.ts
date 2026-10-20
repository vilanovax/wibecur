import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { Prisma } from '@prisma/client';
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

    const rows = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        icon: string;
        slug: string;
        listCount: number;
        thisWeek: number;
        lastWeek: number;
      }[]
    >(Prisma.sql`
      SELECT c.id, c.name, c.icon, c.slug,
             COUNT(DISTINCT l.id)::int AS "listCount",
             COUNT(b.id) FILTER (
               WHERE b."createdAt" >= ${thisWeek.start} AND b."createdAt" < ${thisWeek.end}
             )::int AS "thisWeek",
             COUNT(b.id) FILTER (
               WHERE b."createdAt" >= ${lastWeek.start} AND b."createdAt" < ${lastWeek.end}
             )::int AS "lastWeek"
      FROM categories c
      LEFT JOIN lists l
        ON l."categoryId" = c.id AND l."deletedAt" IS NULL
      LEFT JOIN bookmarks b
        ON b."listId" = l.id AND b."createdAt" >= ${lastWeek.start}
      WHERE c."isActive" = true AND c."deletedAt" IS NULL
      GROUP BY c.id, c.name, c.icon, c.slug
    `);

    return rows
      .map((row) => {
        const thisW = Number(row.thisWeek);
        const lastW = Number(row.lastWeek);
        const growthPercent =
          lastW === 0 ? (thisW > 0 ? 100 : 0) : Math.round(((thisW - lastW) / lastW) * 100);
        return {
          id: row.id,
          name: row.name,
          icon: row.icon,
          slug: row.slug,
          growthPercent,
          activeListsCount: Number(row.listCount),
        };
      })
      .sort((a, b) => b.growthPercent - a.growthPercent);
  });
}

export function getCachedPulseCategories() {
  return unstable_cache(getPulseCategories, ['admin-pulse-categories-v2'], {
    revalidate: CACHE_SECONDS,
    tags: ['admin-pulse'],
  })();
}

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await getCachedPulseCategories();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Pulse categories error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌ها' },
      { status: 500 }
    );
  }
}
