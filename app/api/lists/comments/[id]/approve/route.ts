import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';

// POST /api/lists/comments/[id]/approve - تایید پیشنهاد توسط مالک لیست
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const { id: commentId } = await params;

    const comment = await dbQuery(() =>
      prisma.list_comments.findUnique({
        where: { id: commentId },
        include: {
          lists: {
            select: {
              id: true,
              userId: true,
              itemCount: true,
            },
          },
        },
      })
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    if (comment.type !== 'suggestion') {
      return NextResponse.json(
        { success: false, error: 'فقط پیشنهادها قابل تایید هستند' },
        { status: 400 }
      );
    }

    if (comment.lists.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'فقط مالک لیست می‌تواند تایید کند' },
        { status: 403 }
      );
    }

    if (comment.suggestionStatus === 'approved') {
      return NextResponse.json(
        { success: false, error: 'این پیشنهاد قبلاً تایید شده' },
        { status: 400 }
      );
    }

    const newItem = await dbQuery(async () => {
      return prisma.$transaction(async (tx) => {
        const item = await tx.items.create({
          data: {
            id: nanoid(),
            title: comment.content.trim(),
            listId: comment.listId,
            order: comment.lists.itemCount,
            updatedAt: new Date(),
          },
        });

        await tx.lists.update({
          where: { id: comment.listId },
          data: {
            itemCount: { increment: 1 },
            updatedAt: new Date(),
          },
        });

        const currentComment = await tx.list_comments.findUnique({
          where: { id: commentId },
          select: { weightedScore: true },
        });
        const boost = 0.3;
        await tx.list_comments.update({
          where: { id: commentId },
          data: {
            suggestionStatus: 'approved',
            approvedItemId: item.id,
            weightedScore: (currentComment?.weightedScore ?? 0) + boost,
            updatedAt: new Date(),
          },
        });

        await tx.users.update({
          where: { id: comment.userId },
          data: { reputationScore: { increment: 2 }, updatedAt: new Date() },
        });

        return item;
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        approvedItemId: newItem.id,
        message: 'اضافه شد به لیست',
      },
    });
  } catch (error: any) {
    console.error('Error approving suggestion:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در تایید پیشنهاد' },
      { status: 500 }
    );
  }
}
