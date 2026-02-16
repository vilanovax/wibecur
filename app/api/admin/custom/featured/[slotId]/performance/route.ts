import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { getFeaturedPerformance, getFeaturedRecommendations } from '@/lib/featured-performance';

/**
 * GET /api/admin/custom/featured/[slotId]/performance
 * آمار عملکرد اسلات: CTR، Save Lift، Score Lift و پیشنهادات.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { slotId } = await params;
    const performance = await getFeaturedPerformance(prisma, slotId);
    if (!performance) {
      return NextResponse.json(
        { error: 'اسلات یافت نشد' },
        { status: 404 }
      );
    }

    const recommendations = getFeaturedRecommendations(performance);

    return NextResponse.json({
      performance,
      recommendations,
    });
  } catch (err: unknown) {
    console.error('Featured performance GET error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت آمار' },
      { status: 500 }
    );
  }
}
