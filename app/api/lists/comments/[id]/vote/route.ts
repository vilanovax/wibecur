import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';
import { computeWeightedScore } from '@/lib/comment-utils';
import { checkAchievements } from '@/lib/achievements';

// POST /api/lists/comments/[id]/vote - رای مفید بود / مفید نبود
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

    const userId = (session.user as { id: string }).id;
    const { id: commentId } = await params;
    const body = await request.json();
    const value = body?.value;

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { success: false, error: 'مقدار نامعتبر' },
        { status: 400 }
      );
    }

    const comment = await dbQuery(() =>
      prisma.list_comments.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          userId: true,
          helpfulUp: true,
          helpfulDown: true,
          weightedScore: true,
        },
      })
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    const existing = await dbQuery(() =>
      prisma.list_comment_votes.findUnique({
        where: { userId_commentId: { userId, commentId } },
      })
    );

    let newUp = comment.helpfulUp;
    let newDown = comment.helpfulDown;

    if (existing) {
      if (existing.value === value) {
        return NextResponse.json(
          { success: false, error: 'قبلاً رای داده‌اید' },
          { status: 400 }
        );
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

    const shouldAutoFlag = newDown >= 5;

    await dbQuery(async () => {
      return prisma.$transaction(async (tx) => {
        await tx.list_comment_votes.upsert({
          where: { userId_commentId: { userId, commentId } },
          create: {
            id: nanoid(),
            userId,
            commentId,
            value,
          },
          update: { value },
        });
        await tx.list_comments.update({
          where: { id: commentId },
          data: {
            helpfulUp: newUp,
            helpfulDown: newDown,
            weightedScore,
            ...(shouldAutoFlag ? { status: 'review' } : {}),
            updatedAt: new Date(),
          },
        });
      });
    });

    if (value === 1 && comment.userId) {
      checkAchievements(prisma, comment.userId).catch((e) => console.warn('Achievement check failed:', e));
    }

    return NextResponse.json({
      success: true,
      data: {
        helpfulUp: newUp,
        helpfulDown: newDown,
        weightedScore,
        userVote: value,
      },
    });
  } catch (error: any) {
    console.error('Error voting on comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در ثبت رای' },
      { status: 500 }
    );
  }
}

// GET /api/lists/comments/[id]/vote - وضعیت رای کاربر
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user ? (session.user as { id: string }).id : null;
    const { id: commentId } = await params;

    const comment = await dbQuery(() =>
      prisma.list_comments.findUnique({
        where: { id: commentId },
        select: { helpfulUp: true, helpfulDown: true, weightedScore: true },
      })
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    let userVote: number | null = null;
    if (userId) {
      const vote = await dbQuery(() =>
        prisma.list_comment_votes.findUnique({
          where: { userId_commentId: { userId, commentId } },
          select: { value: true },
        })
      );
      userVote = vote?.value ?? null;
    }

    return NextResponse.json({
      success: true,
      data: {
        helpfulUp: comment.helpfulUp,
        helpfulDown: comment.helpfulDown,
        weightedScore: comment.weightedScore,
        userVote,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'خطا' },
      { status: 500 }
    );
  }
}
