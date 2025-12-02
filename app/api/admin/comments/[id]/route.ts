import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// PUT /api/admin/comments/[id] - ویرایش کامنت
export async function PUT(
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
    const body = await request.json();
    const { content, isApproved, isFiltered } = body;

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    if (isFiltered !== undefined) updateData.isFiltered = isFiltered;

    // Update comment and resolve all reports in a transaction
    const result = await dbQuery(() =>
      prisma.$transaction(async (tx) => {
        // Update comment
        const comment = await tx.comments.update({
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

        // Resolve all unresolved reports for this comment
        await tx.comment_reports.updateMany({
          where: {
            commentId,
            resolved: false,
          },
          data: {
            resolved: true,
          },
        });

        return comment;
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        comment: {
          ...result,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: commentId } = await params;

    // Resolve all reports before deleting (though they'll be cascade deleted)
    // This ensures they're marked as resolved in case of any delay
    await dbQuery(() =>
      prisma.comment_reports.updateMany({
        where: {
          commentId,
          resolved: false,
        },
        data: {
          resolved: true,
        },
      })
    );

    // Delete comment (reports will be cascade deleted)
    await dbQuery(() =>
      prisma.comments.delete({
        where: { id: commentId },
      })
    );

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

