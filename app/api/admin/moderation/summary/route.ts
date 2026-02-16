import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';

/** GET: خلاصهٔ صف (تعداد باز، در حال بررسی، شدت بالا، حل‌شده امروز) */
export async function GET(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('view_moderation');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [open, inReview, highSeverity, resolvedToday] = await Promise.all([
      prisma.moderation_case.count({ where: { status: 'OPEN' } }),
      prisma.moderation_case.count({ where: { status: 'IN_REVIEW' } }),
      prisma.moderation_case.count({
        where: { severity: 3, status: { in: ['OPEN', 'IN_REVIEW'] } },
      }),
      prisma.moderation_case.count({
        where: {
          status: 'RESOLVED',
          updatedAt: { gte: todayStart },
        },
      }),
    ]);

    return NextResponse.json({
      open,
      inReview,
      highSeverity,
      resolvedToday,
    });
  } catch (err: unknown) {
    console.error('Moderation summary error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت خلاصه' },
      { status: 500 }
    );
  }
}
