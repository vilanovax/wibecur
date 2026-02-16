import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { getWeeklyFeaturedReport } from '@/lib/featured-performance';

/**
 * GET /api/admin/custom/featured/weekly-report?weekStart=YYYY-MM-DD
 * گزارش هفتگی اسلات‌های Featured. weekStart = اولین روز هفته (۰۰:۰۰).
 */
export async function GET(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(request.url);
    const weekStartParam = searchParams.get('weekStart');

    let weekStart: Date;
    if (weekStartParam) {
      weekStart = new Date(weekStartParam);
      if (isNaN(weekStart.getTime())) {
        return NextResponse.json(
          { error: 'weekStart نامعتبر است. فرمت: YYYY-MM-DD' },
          { status: 400 }
        );
      }
    } else {
      weekStart = new Date();
      const day = weekStart.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      weekStart.setDate(weekStart.getDate() + diff);
    }
  weekStart.setHours(0, 0, 0, 0);

    const report = await getWeeklyFeaturedReport(prisma, weekStart);
    return NextResponse.json(report);
  } catch (err: unknown) {
    console.error('Featured weekly-report error:', err);
    return NextResponse.json(
      { error: 'خطا در تولید گزارش هفتگی' },
      { status: 500 }
    );
  }
}
