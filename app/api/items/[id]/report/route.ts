import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  VALID_REPORT_REASONS,
  getUserTrustWeight,
  calcReportWeight,
  applyReportWeight,
} from '@/lib/moderation';
import { createNotification } from '@/lib/utils/notifications';

// POST /api/items/[id]/report - ریپورت کردن یک آیتم + Auto Flagging (Moderation Engine v1)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: itemId } = await params;
    let body: { reason?: unknown; description?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'بدنه درخواست نامعتبر است' },
        { status: 400 }
      );
    }

    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : undefined;

    if (!reason || !VALID_REPORT_REASONS.includes(reason as (typeof VALID_REPORT_REASONS)[number])) {
      return NextResponse.json(
        { success: false, error: 'دلیل ریپورت نامعتبر است' },
        { status: 400 }
      );
    }

    if (reason === 'other' && !description) {
      return NextResponse.json(
        { success: false, error: 'لطفاً توضیحات را وارد کنید' },
        { status: 400 }
      );
    }

    const item = await prisma.items.findUnique({
      where: { id: itemId },
      include: { lists: { select: { userId: true } } },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'آیتم یافت نشد' },
        { status: 404 }
      );
    }

    if (!prisma.item_reports) {
      console.error('prisma.item_reports is undefined. Prisma Client may need regeneration.');
      return NextResponse.json(
        { success: false, error: 'خطای داخلی سرور. لطفاً دوباره تلاش کنید.' },
        { status: 500 }
      );
    }

    const existingReport = await dbQuery(() =>
      prisma.item_reports.findFirst({
        where: { itemId, userId, resolved: false },
      })
    );

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'شما قبلاً این آیتم را ریپورت کرده‌اید' },
        { status: 400 }
      );
    }

    // وزن گزارش = اعتماد کاربر × نوع گزارش
    const reporter = await dbQuery(() =>
      prisma.users.findUnique({
        where: { id: userId },
        select: { curatorLevel: true },
      })
    );
    const userTrust = getUserTrustWeight(reporter?.curatorLevel ?? null);
    const weight = calcReportWeight(reason, userTrust);

    // ثبت گزارش با وزن لحظه ثبت
    await dbQuery(() =>
      prisma.item_reports.create({
        data: {
          itemId,
          userId,
          reason,
          description: reason === 'other' ? (description ?? '').trim() || null : null,
          weightSnapshot: weight,
        },
      })
    );

    // به‌روزرسانی Flag Score و وضعیت (Soft Flag / Under Review / Hidden)
    const newStatus = await applyReportWeight(itemId, weight);

    // اگر آیتم مخفی شد، به سازنده نوتیفیکیشن بفرست
    if (newStatus === 'HIDDEN' && item.lists?.userId) {
      try {
        await createNotification(
          item.lists.userId,
          'item_under_review',
          'نیاز به بررسی',
          'یکی از آیتم‌های شما نیاز به بررسی دارد.',
          `/items/${itemId}`
        );
      } catch (e) {
        console.error('Failed to send moderation notification:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ریپورت با موفقیت ثبت شد',
    });
  } catch (error: unknown) {
    console.error('Error reporting item:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

