import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getClientErrorMessage, logServerError } from '@/lib/api-error';

// DELETE /api/comments/[id] - حذف کامنت
export async function DELETE(
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

    // Check if comment exists and belongs to user
    const comment = await dbQuery(() =>
      prisma.comments.findUnique({
        where: { id: commentId },
      })
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    // Check if user owns the comment
    if (comment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'شما اجازه حذف این کامنت را ندارید' },
        { status: 403 }
      );
    }

    // Delete comment (cascade will handle related data)
    await dbQuery(() =>
      prisma.comments.delete({
        where: { id: commentId },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'کامنت با موفقیت حذف شد',
    });
  } catch (error) {
    logServerError('DELETE /api/comments/[id]', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در حذف کامنت') },
      { status: 500 }
    );
  }
}

