import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/comments/reports - لیست ریپورت‌ها
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const resolved = searchParams.get('resolved');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (resolved === 'false') {
      where.resolved = false;
    } else if (resolved === 'true') {
      where.resolved = true;
    }

    const [totalCount, reports] = await Promise.all([
      prisma.comment_reports.count({ where }),
      prisma.comment_reports.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          comments: {
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
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Group reports by commentId
    const reportsByComment = new Map();
    reports.forEach((report) => {
      const commentId = report.commentId;
      if (!reportsByComment.has(commentId)) {
        reportsByComment.set(commentId, {
          comment: report.comments,
          reports: [],
          reportCount: 0,
        });
      }
      reportsByComment.get(commentId).reports.push(report);
      reportsByComment.get(commentId).reportCount += 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        reports: Array.from(reportsByComment.values()),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

