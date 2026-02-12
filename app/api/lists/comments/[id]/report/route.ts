import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// POST /api/lists/comments/[id]/report - ریپورت کامنت لیست
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
    const body = await request.json();
    const { reason } = body;

    // Check if comment exists
    const comment = await dbQuery(() =>
      prisma.list_comments.findUnique({
        where: { id: commentId },
      })
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    // Check if already reported by this user
    const existingReport = await dbQuery(() =>
      prisma.list_comment_reports.findFirst({
        where: {
          commentId,
          userId,
          resolved: false,
        },
      })
    );

    if (existingReport) {
      return NextResponse.json({
        success: true,
        message: 'شما قبلاً این کامنت را گزارش کرده‌اید',
        alreadyReported: true,
      });
    }

    await dbQuery(async () => {
      const existing = await prisma.list_comment_reports.findFirst({
        where: { commentId, userId },
      });
      if (existing) {
        return;
      }
      await prisma.list_comment_reports.create({
        data: {
          commentId,
          userId,
          reason: reason || 'بدون دلیل',
        },
      });
      const reportCount = await prisma.list_comment_reports.count({
        where: { commentId },
      });
      if (reportCount >= 3) {
        await prisma.list_comments.update({
          where: { id: commentId },
          data: { status: 'review', updatedAt: new Date() },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'ممنون که اطلاع دادی 🙏 بررسیش می‌کنیم',
    });
  } catch (error: any) {
    console.error('Error reporting list comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

