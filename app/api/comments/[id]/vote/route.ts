import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';
import { computeWeightedScore } from '@/lib/comment-utils';

// POST /api/comments/[id]/vote — رای مفید بود / مفید نبود (کامنت آیتم)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'برای رای دادن باید وارد شوید' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: commentId } = await params;
    const body = await request.json();
    const value = body?.value;

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ success: false, error: 'مقدار نامعتبر' }, { status: 400 });
    }

    const comment = await dbQuery(() =>
      prisma.comments.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          helpfulUp: true,
          helpfulDown: true,
          likeCount: true,
        },
      })
    );

    if (!comment) {
      return NextResponse.json({ success: false, error: 'نظر یافت نشد' }, { status: 404 });
    }

    const existing = await dbQuery(() =>
      prisma.comment_votes.findUnique({
        where: { userId_commentId: { userId, commentId } },
      })
    );

    let newUp = comment.helpfulUp;
    let newDown = comment.helpfulDown;

    if (existing) {
      if (existing.value === value) {
        return NextResponse.json({ success: false, error: 'قبلاً رای داده‌اید' }, { status: 400 });
      }
      if (existing.value === 1) {
        newUp = Math.max(0, newUp - 1);
      } else {
        newDown = Math.max(0, newDown - 1);
      }
    }

    if (value === 1) {
      newUp += 1;
    } else {
      newDown += 1;
    }

    const weightedScore = computeWeightedScore(newUp, newDown);

    await dbQuery(async () => {
      return prisma.$transaction(async (tx) => {
        await tx.comment_votes.upsert({
          where: { userId_commentId: { userId, commentId } },
          create: {
            id: nanoid(),
            userId,
            commentId,
            value,
          },
          update: { value },
        });
        await tx.comments.update({
          where: { id: commentId },
          data: {
            helpfulUp: newUp,
            helpfulDown: newDown,
            weightedScore,
            updatedAt: new Date(),
          },
        });
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        helpfulUp: newUp,
        helpfulDown: newDown,
        weightedScore,
        userVote: value,
      },
    });
  } catch (error) {
    console.error('Error voting on item comment:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در ثبت رای' },
      { status: 500 }
    );
  }
}
