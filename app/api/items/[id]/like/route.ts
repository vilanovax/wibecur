import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';

// POST /api/items/[id]/like - لایک/آنلایک کردن آیتم
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const { id: itemId } = await params;

    // Get user
    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: session.user.email! },
      })
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if item exists
    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
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
            userId: user.id,
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
                userId: user.id,
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
              userId: user.id,
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
      userId: user.id,
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
        error: error.message || 'خطا در لایک کردن آیتم',
      },
      { status: 500 }
    );
  }
}

// GET /api/items/[id]/like - دریافت وضعیت لایک کاربر
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const { id: itemId } = await params;

    // Get user
    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: session.user.email! },
      })
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Get item with vote count
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

    // Check if user has liked this item
    const existingVote = await dbQuery(() =>
      prisma.item_votes.findUnique({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId: itemId,
          },
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        isLiked: !!existingVote,
        likeCount: item.voteCount || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching item like status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'خطا در دریافت وضعیت لایک',
      },
      { status: 500 }
    );
  }
}

