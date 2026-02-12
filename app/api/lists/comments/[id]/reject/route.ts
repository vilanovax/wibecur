import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// POST /api/lists/comments/[id]/reject - رد پیشنهاد توسط مالک لیست
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
          lists: { select: { userId: true } },
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
        { success: false, error: 'فقط پیشنهادها قابل رد هستند' },
        { status: 400 }
      );
    }

    if (comment.lists.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'فقط مالک لیست می‌تواند رد کند' },
        { status: 403 }
      );
    }

    await dbQuery(() =>
      prisma.list_comments.update({
        where: { id: commentId },
        data: {
          suggestionStatus: 'rejected',
          updatedAt: new Date(),
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: { message: 'پیشنهاد رد شد' },
    });
  } catch (error: any) {
    console.error('Error rejecting suggestion:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در رد پیشنهاد' },
      { status: 500 }
    );
  }
}
