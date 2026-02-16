import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';
import { checkAchievements } from '@/lib/achievements';
import { getTrendingScoreForList } from '@/lib/trending/service';

// POST /api/lists/[id]/bookmark - بوک‌مارک یا آنبوک‌مارک کردن لیست
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: listId } = await params;

    // Check if list exists
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
      })
    );

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    // Check if bookmark already exists
    const existingBookmark = await dbQuery(() =>
      prisma.bookmarks.findFirst({
        where: {
          userId,
          listId,
        },
      })
    );

    const { isBookmarked, bookmarkCount } = await dbQuery(() =>
      prisma.$transaction(async (tx) => {
        if (existingBookmark) {
          await tx.bookmarks.deleteMany({
            where: { userId, listId },
          });
          const updated = await tx.lists.update({
            where: { id: listId },
            data: { saveCount: { decrement: 1 } },
            select: { saveCount: true },
          });
          return { isBookmarked: false as const, bookmarkCount: updated.saveCount };
        } else {
          await tx.bookmarks.create({
            data: {
              id: nanoid(),
              userId,
              listId,
            },
          });
          const updated = await tx.lists.update({
            where: { id: listId },
            data: { saveCount: { increment: 1 } },
            select: { saveCount: true },
          });
          return { isBookmarked: true as const, bookmarkCount: updated.saveCount };
        }
      })
    );

    if (isBookmarked && list.userId) {
      checkAchievements(prisma, list.userId).catch((e) => console.warn('Achievement check failed:', e));
    }

    if (isBookmarked) {
      const now = new Date();
      const activeSlot = await prisma.home_featured_slot.findFirst({
        where: {
          listId,
          startAt: { lte: now },
          OR: [{ endAt: null }, { endAt: { gte: now } }],
        },
        select: { id: true, peakScore: true },
      });
      if (activeSlot) {
        const currentScore = await getTrendingScoreForList(prisma, listId);
        const newPeak =
          activeSlot.peakScore != null && currentScore <= activeSlot.peakScore
            ? undefined
            : currentScore;
        await prisma.home_featured_slot.update({
          where: { id: activeSlot.id },
          data: {
            savesDuring: { increment: 1 },
            ...(newPeak !== undefined ? { peakScore: newPeak } : {}),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isBookmarked,
        bookmarkCount,
      },
    });
  } catch (error: any) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در بوک‌مارک کردن لیست' },
      { status: 500 }
    );
  }
}

