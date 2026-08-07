import { NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { tryApiDbFallback } from '@/lib/api-db';

/**
 * GET /api/home/categories
 * ۴ دستهٔ اصلی برای گرید صفحهٔ Home با تعداد لیست‌ها
 */
export async function GET() {
  try {
    const cats = await dbQuery(() =>
      prisma.categories.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
          _count: { select: { lists: true } },
        },
        orderBy: { order: 'asc' },
        take: 4,
      })
    );

    // فقط لیست‌های عمومی و فعال
    const categoryIds = cats.map((c) => c.id);
    const counts = await dbQuery(() =>
      prisma.lists.groupBy({
        by: ['categoryId'],
        where: {
          categoryId: { in: categoryIds },
          isPublic: true,
          isActive: true,
        },
        _count: { id: true },
      })
    );
    const countMap = new Map(counts.map((r) => [r.categoryId, r._count.id]));

    const data = cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon ?? '📋',
      color: c.color ?? null,
      listCount: countMap.get(c.id) ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, [], 'Home categories');
    if (fb) return fb;
    console.error('Home categories error:', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا') },
      { status: 500 }
    );
  }
}
