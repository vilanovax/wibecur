import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { tryApiDbFallback } from '@/lib/api-db';

/** GET /api/lists/public — لیست‌های عمومی و فعال */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const where = {
      isActive: true,
      isPublic: true,
      users: {
        role: {
          not: 'USER' as const,
        },
      },
      ...(categoryId ? { categoryId } : {}),
    };

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
        orderBy: { title: 'asc' },
      })
    );

    const response = NextResponse.json({ success: true, data: lists });
    response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, [], 'Public lists');
    if (fb) {
      fb.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return fb;
    }
    console.error('Error fetching public lists:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message || 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}
