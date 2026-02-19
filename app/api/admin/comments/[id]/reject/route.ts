import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: commentId } = await params;

    const comment = await dbQuery(() =>
      prisma.comments.findUnique({ where: { id: commentId } })
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    await dbQuery(() =>
      prisma.comments.update({
        where: { id: commentId },
        data: { isApproved: false },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'کامنت رد شد',
    });
  } catch (error: any) {
    console.error('Error rejecting comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
