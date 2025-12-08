import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/admin/suggestions/items - دریافت لیست پیشنهادات آیتم
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected
    const sort = searchParams.get('sort') || 'newest'; // newest, oldest
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Determine sort order
    const orderBy: { createdAt: 'asc' | 'desc' } = sort === 'oldest' 
      ? { createdAt: 'asc' } 
      : { createdAt: 'desc' };

    const [totalCount, suggestions] = await Promise.all([
      dbQuery(() => prisma.suggested_items.count({ where })),
      dbQuery(() =>
        prisma.suggested_items.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            lists: {
              include: {
                categories: true,
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

    const totalPages = Math.ceil(totalCount / limit);

    const serializedSuggestions = suggestions.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        suggestions: serializedSuggestions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching suggested items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت پیشنهادات' },
      { status: 500 }
    );
  }
}

