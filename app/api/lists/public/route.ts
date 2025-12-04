import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/lists/public - دریافت لیست‌های عمومی و فعال
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const where: any = {
      isActive: true,
      isPublic: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const lists = await dbQuery(() =>
      prisma.lists.findMany({
        where,
        select: {
          id: true,
          title: true,
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
        orderBy: {
          title: 'asc',
        },
      })
    );

    const response = NextResponse.json({
      success: true,
      data: lists,
    });

    // Add cache headers for client-side caching
    response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
    
    return response;
  } catch (error: any) {
    console.error('Error fetching public lists:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}

