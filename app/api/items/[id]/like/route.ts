import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId, sessionUserNotFoundResponse } from '@/lib/api-db';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';

// POST /api/items/[id]/like - لایک/آنلایک کردن آیتم
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const { id: itemId } = await params;

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return sessionUserNotFoundResponse();
    }

    // Check if item exists
    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        select: { id: true },
      })
    );

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'آیتم یافت نشد' },
        { status: 404 }
      );
    }

    // Check if user has already liked this item
    const existingVote = await dbQuery(() =>
      prisma.item_votes.findUnique({
        where: {
          userId_itemId: {
            userId,
            itemId: itemId,
          },
        },
      })
    );

    if (existingVote) {
      // Unlike: Delete the vote
      await dbQuery(async () => {
        await prisma.$transaction(async (tx) => {
          await tx.item_votes.delete({
            where: {
              userId_itemId: {
                userId: userId,
                itemId: itemId,
              },
            },
          });

          // Update item voteCount
          await tx.items.update({
            where: { id: itemId },
            data: {
              voteCount: {
                decrement: 1,
              },
            },
          });
        });
      });
    } else {
      // Like: Create vote (value = 1 for like)
      await dbQuery(async () => {
        await prisma.$transaction(async (tx) => {
          await tx.item_votes.create({
            data: {
              id: nanoid(),
              userId: userId,
              itemId: itemId,
              value: 1, // 1 for like
            },
          });

          // Update item voteCount
          await tx.items.update({
            where: { id: itemId },
            data: {
              voteCount: {
                increment: 1,
              },
            },
          });
        });
      });
    }

    // Fetch updated item to get the actual voteCount
    const updatedItem = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        select: {
          voteCount: true,
        },
      })
    );

    // Check if user has liked (opposite of what we just did)
    const currentVoteStatus = !existingVote;
    const finalLikeCount = updatedItem?.voteCount || 0;

    console.log('Item like toggled:', {
      itemId,
      userId: userId,
      wasLiked: !!existingVote,
      nowLiked: currentVoteStatus,
      likeCount: finalLikeCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        isLiked: currentVoteStatus,
        likeCount: finalLikeCount,
      },
    });
  } catch (error: any) {
    console.error('Error toggling item like:', error);
    return NextResponse.json(
      {
        success: false,
        error: getClientErrorMessage(error, 'خطا در لایک کردن آیتم'),
      },
      { status: 500 }
    );
  }
}

// GET /api/items/[id]/like - تعداد لایک عمومی + وضعیت لایک کاربر (اگر لاگین باشد)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;

    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        select: {
          voteCount: true,
        },
      })
    );

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'آیتم یافت نشد' },
        { status: 404 }
      );
    }

    let isLiked = false;
    const session = await auth();
    const userId = session?.user ? await resolveSessionUserId(session) : null;

    if (userId) {
      const existingVote = await dbQuery(() =>
        prisma.item_votes.findUnique({
          where: {
            userId_itemId: {
              userId,
              itemId: itemId,
            },
          },
        })
      );
      isLiked = !!existingVote;
    }

    return NextResponse.json({
      success: true,
      data: {
        isLiked,
        likeCount: item.voteCount || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching item like status:', error);
    return NextResponse.json(
      {
        success: false,
        error: getClientErrorMessage(error, 'خطا در دریافت وضعیت لایک'),
      },
      { status: 500 }
    );
  }
}

