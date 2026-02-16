import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { getRotationInsight } from '@/lib/featured-rotation';

/**
 * GET /api/admin/custom/featured/rotation-insight
 * بینش چرخش دسته‌ها: تعداد Featured هر دسته در ۴ هفته اخیر و پیشنهاد دستهٔ بعد.
 */
export async function GET() {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const result = await getRotationInsight(prisma);
    return NextResponse.json({
      categoryStats: result.categoryStats,
      suggestedCategory: result.suggestedCategory,
      suggestedCategoryId: result.suggestedCategoryId,
      reasoning: result.reasoning,
    });
  } catch (err: unknown) {
    console.error('Featured rotation-insight error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت بینش چرخش' },
      { status: 500 }
    );
  }
}
