import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// POST /api/admin/items/reports/[id]/resolve - حل کردن گزارش آیتم
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

    await dbQuery(() =>
      prisma.item_reports.update({
        where: { id: reportId },
        data: {
          resolved: true,
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'گزارش با موفقیت حل شد',
    });
  } catch (error: any) {
    console.error('Error resolving item report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

