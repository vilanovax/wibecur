import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';

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

    const userId = (session.user as any).id;
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

    let isBookmarked: boolean;
    let bookmarkCount: number;

    if (existingBookmark) {
      // Remove bookmark
      await dbQuery(() =>
        prisma.bookmarks.deleteMany({
          where: {
            userId,
            listId,
          },
        })
      );

      // Decrement saveCount
      await dbQuery(() =>
        prisma.lists.update({
          where: { id: listId },
          data: {
            saveCount: {
              decrement: 1,
            },
          },
        })
      );

      isBookmarked = false;
    } else {
      // Create bookmark
      await dbQuery(() =>
        prisma.bookmarks.create({
          data: {
            id: nanoid(),
            userId,
            listId,
          },
        })
      );

      // Increment saveCount
      await dbQuery(() =>
        prisma.lists.update({
          where: { id: listId },
          data: {
            saveCount: {
              increment: 1,
            },
          },
        })
      );

      isBookmarked = true;
    }

    // Get updated bookmark count
    const updatedList = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: { saveCount: true },
      })
    );

    bookmarkCount = updatedList?.saveCount || 0;

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

