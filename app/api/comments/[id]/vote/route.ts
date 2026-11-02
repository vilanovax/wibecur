import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { applyItemCommentVote } from '@/lib/comment-vote';

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

    const result = await dbQuery(() =>
      prisma.$transaction((tx) =>
        applyItemCommentVote(tx, { userId, commentId, value })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        helpfulUp: result.helpfulUp,
        helpfulDown: result.helpfulDown,
        weightedScore: result.weightedScore,
        userVote: result.userVote,
      },
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'NOT_FOUND' || (error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'نظر یافت نشد' }, { status: 404 });
    }
    if (code === 'SELF_VOTE') {
      return NextResponse.json(
        { success: false, error: 'نمی‌توانید به نظر خودتان رای دهید' },
        { status: 403 }
      );
    }
    console.error('Error voting on item comment:', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در ثبت رای') },
      { status: 500 }
    );
  }
}
