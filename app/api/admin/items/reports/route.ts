import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/admin/items/reports - لیست گزارش‌های آیتم‌ها
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
      dbQuery(() => prisma.item_reports.count({ where })),
      dbQuery(() =>
        prisma.item_reports.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              select: {
                id: true,
                title: true,
                description: true,
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
        })
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reports: reports.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
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
    console.error('Error fetching item reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

