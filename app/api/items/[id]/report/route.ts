import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// POST /api/items/[id]/report - ریپورت کردن یک آیتم
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { id: itemId } = await params;
    const body = await request.json();
    const { reason, description } = body;

    // Validate reason
    const validReasons = ['spelling_error', 'incorrect_info', 'offensive', 'other'];
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'دلیل ریپورت نامعتبر است' },
        { status: 400 }
      );
    }

    // Validate description for 'other' reason
    if (reason === 'other' && (!description || !description.trim())) {
      return NextResponse.json(
        { success: false, error: 'لطفاً توضیحات را وارد کنید' },
        { status: 400 }
      );
    }

    // Check if item exists
    const item = await prisma.items.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'آیتم یافت نشد' },
        { status: 404 }
      );
    }

    // Check if user has already reported this item
    // Check if model exists first
    if (!prisma.item_reports) {
      console.error('prisma.item_reports is undefined. Prisma Client may need regeneration.');
      return NextResponse.json(
        { success: false, error: 'خطای داخلی سرور. لطفاً دوباره تلاش کنید.' },
        { status: 500 }
      );
    }

    const existingReport = await dbQuery(() =>
      prisma.item_reports.findFirst({
        where: {
          itemId,
          userId,
          resolved: false,
        },
      })
    );

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'شما قبلاً این آیتم را ریپورت کرده‌اید' },
        { status: 400 }
      );
    }

    // Create report
    await dbQuery(() =>
      prisma.item_reports.create({
        data: {
          itemId,
          userId,
          reason,
          description: reason === 'other' ? description.trim() : null,
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'ریپورت با موفقیت ثبت شد',
    });
  } catch (error: any) {
    console.error('Error reporting item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

