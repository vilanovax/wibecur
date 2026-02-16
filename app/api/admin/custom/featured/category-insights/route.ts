import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { getFeaturedCategoryInsights } from '@/lib/featured-performance';

/**
 * GET /api/admin/custom/featured/category-insights?range=last30days
 * بینش دسته‌بندی: عملکرد Featured به تفکیک دسته. range = last30days | last7days
 */
export async function GET(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') ?? 'last30days';
    const rangeDays = range === 'last7days' ? 7 : 30;

    const result = await getFeaturedCategoryInsights(prisma, rangeDays);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Featured category-insights error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت بینش دسته‌بندی' },
      { status: 500 }
    );
  }
}
