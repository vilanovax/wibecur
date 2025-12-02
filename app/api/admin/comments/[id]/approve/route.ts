import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/admin/comments/[id]/approve - تایید کامنت و حذف ریپورت‌ها
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: commentId } = await params;

    await prisma.$transaction([
      // Approve comment
      prisma.comments.update({
        where: { id: commentId },
        data: {
          isApproved: true,
          isFiltered: false,
        },
      }),
      // Resolve all reports
      prisma.comment_reports.updateMany({
        where: { commentId, resolved: false },
        data: { resolved: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'کامنت تایید شد و ریپورت‌ها پاک شدند',
    });
  } catch (error: any) {
    console.error('Error approving comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

