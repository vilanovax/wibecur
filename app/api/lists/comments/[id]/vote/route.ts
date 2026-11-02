import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { applyListCommentVote } from '@/lib/comment-vote';
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

    const authorId = await dbQuery(() =>
      prisma.list_comments.findUnique({
        where: { id: commentId },
        select: { userId: true },
      })
    ).then((row) => row?.userId ?? null);

    const result = await dbQuery(() =>
      prisma.$transaction((tx) =>
        applyListCommentVote(tx, { userId, commentId, value })
      )
    );

    if (value === 1 && authorId && result.userVote === 1) {
      checkAchievements(prisma, authorId).catch((e) =>
        console.warn('Achievement check failed:', e)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        helpfulUp: result.helpfulUp,
        helpfulDown: result.helpfulDown,
        weightedScore: result.weightedScore,
        userVote: result.userVote,
      },
    });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === 'NOT_FOUND' || code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }
    if (code === 'SELF_VOTE') {
      return NextResponse.json(
        { success: false, error: 'نمی‌توانید به نظر خودتان رای دهید' },
        { status: 403 }
      );
    }
    console.error('Error voting on comment:', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در ثبت رای') },
      { status: 500 }
    );
  }
}

// GET /api/lists/comments/[id]/vote - وضعیت رای کاربر
export async function GET(
  _request: NextRequest,
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
  } catch {
    return NextResponse.json(
      { success: false, error: 'خطا' },
      { status: 500 }
    );
  }
}
