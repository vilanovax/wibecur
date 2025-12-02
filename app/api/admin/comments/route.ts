import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/admin/comments - لیست کامنت‌ها
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const filter = searchParams.get('filter') || 'all'; // all, approved, reported, filtered
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null, // Only show non-deleted comments by default
    };
    if (filter === 'approved') {
      where.isApproved = true;
      where.isFiltered = false;
    } else if (filter === 'reported') {
      where.comment_reports = { some: { resolved: false } };
    } else if (filter === 'filtered') {
      where.isFiltered = true;
    }

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    const [totalCount, comments] = await Promise.all([
      prisma.comments.count({ where }),
      prisma.comments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          items: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              comment_reports: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        comments: comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/comments - حذف کامنت
export async function DELETE(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { success: false, error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Resolve all reports before soft deleting
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

    // Soft delete comment (set deletedAt instead of deleting)
    const deletedComment = await dbQuery(() =>
      prisma.comments.update({
        where: { id: commentId },
        data: {
          deletedAt: new Date(),
        },
      })
    );

    console.log('Comment soft deleted:', {
      id: commentId,
      deletedAt: deletedComment.deletedAt,
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

