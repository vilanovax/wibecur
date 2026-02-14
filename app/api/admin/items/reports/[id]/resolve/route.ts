import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { recalcItemModeration } from '@/lib/moderation';

// POST /api/admin/items/reports/[id]/resolve - حل کردن گزارش آیتم + Recovery (بازمحاسبه Flag Score)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: reportId } = await params;

    const report = await dbQuery(() =>
      prisma.item_reports.findUnique({
        where: { id: reportId },
        select: { itemId: true },
      })
    );

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'گزارش یافت نشد' },
        { status: 404 }
      );
    }

    await dbQuery(() =>
      prisma.item_reports.update({
        where: { id: reportId },
        data: { resolved: true },
      })
    );

    // بازمحاسبه Flag Score فقط از گزارش‌های حل‌نشده؛ اگر همه حل شدند → NORMAL
    await recalcItemModeration(report.itemId);

    return NextResponse.json({
      success: true,
      message: 'گزارش با موفقیت حل شد',
    });
  } catch (error: unknown) {
    console.error('Error resolving item report:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

