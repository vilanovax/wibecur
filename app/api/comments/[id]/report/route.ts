import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';

// POST /api/comments/[id]/report - ریپورت کامنت
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
    const { id: commentId } = await params;
    const body = await request.json();
    const { reason } = body;

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

    // Check if already reported by this user
    const existingReport = await prisma.comment_reports.findFirst({
      where: {
        commentId,
        userId,
        resolved: false,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'شما قبلاً این کامنت را گزارش کرده‌اید' },
        { status: 400 }
      );
    }

    // Create report
    await prisma.comment_reports.create({
      data: {
        commentId,
        userId,
        reason: reason || 'بدون دلیل',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'کامنت با موفقیت گزارش شد',
    });
  } catch (error: any) {
    console.error('Error reporting comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

