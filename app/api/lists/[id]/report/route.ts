import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

const VALID_LIST_REPORT_REASONS = [
  'spam',
  'offensive',
  'misleading',
  'wrong_category',
  'other',
] as const;

/** POST /api/lists/[id]/report — گزارش لیست */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'برای گزارش باید وارد شوی' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: listId } = await params;

    let body: { reason?: unknown; description?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'بدنه درخواست نامعتبر است' }, { status: 400 });
    }

    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : undefined;

    if (!VALID_LIST_REPORT_REASONS.includes(reason as (typeof VALID_LIST_REPORT_REASONS)[number])) {
      return NextResponse.json({ success: false, error: 'دلیل گزارش نامعتبر است' }, { status: 400 });
    }

    if (reason === 'other' && !description) {
      return NextResponse.json({ success: false, error: 'لطفاً توضیحات را وارد کنید' }, { status: 400 });
    }

    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: { id: true, userId: true, isActive: true },
      })
    );

    if (!list || !list.isActive) {
      return NextResponse.json({ success: false, error: 'لیست یافت نشد' }, { status: 404 });
    }

    if (list.userId === userId) {
      return NextResponse.json({ success: false, error: 'نمی‌توانی لیست خودت را گزارش کنی' }, { status: 400 });
    }

    const existingReport = await dbQuery(() =>
      prisma.list_reports.findFirst({
        where: { listId, userId, resolved: false },
      })
    );

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'گزارش قبلی‌ات برای این لیست ثبت شده' },
        { status: 400 }
      );
    }

    await dbQuery(() =>
      prisma.list_reports.create({
        data: {
          listId,
          userId,
          reason,
          description: reason === 'other' ? description ?? null : null,
        },
      })
    );

    return NextResponse.json({ success: true, message: 'گزارش با موفقیت ثبت شد' });
  } catch (error: unknown) {
    console.error('Error reporting list:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطای سرور' },
      { status: 500 }
    );
  }
}
