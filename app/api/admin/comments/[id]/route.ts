import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/comments/[id] - ویرایش کامنت
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: commentId } = await params;
    const body = await request.json();
    const { content, isApproved, isFiltered } = body;

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    if (isFiltered !== undefined) updateData.isFiltered = isFiltered;

    const comment = await prisma.comments.update({
      where: { id: commentId },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        comment: {
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/comments/[id] - حذف کامنت
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: commentId } = await params;

    await prisma.comments.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: 'کامنت با موفقیت حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

