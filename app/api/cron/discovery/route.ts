import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeAndUpsertUserCategoryAffinity } from '@/lib/discovery';

const CRON_SECRET = process.env.CRON_SECRET || process.env.REVALIDATE_SECRET;

/** POST /api/cron/discovery — به‌روزرسانی وزن دسته‌ای کاربران (روزانه). */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (CRON_SECRET && secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userIds = await prisma.bookmarks.findMany({
      select: { userId: true },
      distinct: ['userId'],
    }).then((r) => [...new Set(r.map((x) => x.userId))]);
    const listUserIds = await prisma.lists.findMany({
      where: { isPublic: true },
      select: { userId: true },
      distinct: ['userId'],
    }).then((r) => [...new Set(r.map((x) => x.userId))]);
    const likeUserIds = await prisma.list_likes.findMany({
      select: { userId: true },
      distinct: ['userId'],
    }).then((r) => [...new Set(r.map((x) => x.userId))]);
    const all = new Set([...userIds, ...listUserIds, ...likeUserIds]);

    let done = 0;
    for (const userId of all) {
      await computeAndUpsertUserCategoryAffinity(prisma, userId);
      done++;
    }

    return NextResponse.json({
      success: true,
      message: `Discovery affinity updated for ${done} users`,
    });
  } catch (e) {
    console.error('Cron discovery error:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
