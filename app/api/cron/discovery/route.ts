import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeAndUpsertUserCategoryAffinity } from '@/lib/discovery';
import { authorizeCron } from '@/lib/cron-auth';
import { logServerError } from '@/lib/api-error';

/** POST /api/cron/discovery — به‌روزرسانی وزن دسته‌ای کاربران (روزانه). */
export async function POST(request: NextRequest) {
  const authResult = authorizeCron(request);
  if (!authResult.ok) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  try {
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
    logServerError('cron/discovery', e);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
