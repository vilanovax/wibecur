import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { tryApiDbFallback } from '@/lib/api-db';

/** GET /api/categories — دسته‌بندی‌های فعال */
export async function GET(_request: NextRequest) {
  try {
    const categories = await dbQuery(() =>
      prisma.categories.findMany({
        where: { isActive: true, deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
        },
        orderBy: { order: 'asc' },
      })
    );

    const response = NextResponse.json({ success: true, data: categories });
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, [], 'Categories');
    if (fb) {
      fb.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return fb;
    }
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message || 'خطا در دریافت دسته‌بندی‌ها' },
      { status: 500 }
    );
  }
}
