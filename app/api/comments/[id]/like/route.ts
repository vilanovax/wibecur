import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';

// POST /api/comments/[id]/like - لایک/آنلایک کامنت
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
    const { id: commentId } = await params;

    // Check if comment exists
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.comment_likes.findFirst({
      where: {
        commentId,
        userId,
      },
    });

    let isLiked: boolean;
    let newLikeCount: number;

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.comment_likes.delete({
          where: {
            id: existingLike.id,
          },
        }),
        prisma.comments.update({
          where: { id: commentId },
          data: {
            likeCount: { decrement: 1 },
          },
        }),
      ]);
      isLiked = false;
      newLikeCount = comment.likeCount - 1;
    } else {
      // Like
      await prisma.$transaction([
        prisma.comment_likes.create({
          data: {
            commentId,
            userId,
          },
        }),
        prisma.comments.update({
          where: { id: commentId },
          data: {
            likeCount: { increment: 1 },
          },
        }),
      ]);
      isLiked = true;
      newLikeCount = comment.likeCount + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        isLiked,
        likeCount: newLikeCount,
      },
    });
  } catch (error: any) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

