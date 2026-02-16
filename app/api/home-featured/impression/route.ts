import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/home-featured/impression
 * یک بار در هر session وقتی هوم اسلات منتخب را نشان می‌دهد صدا زده شود.
 * body: { slotId: string }
 * افزایش اتمیک impressions.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const slotId = body?.slotId;

    if (!slotId || typeof slotId !== 'string') {
      return NextResponse.json(
        { error: 'slotId الزامی است' },
        { status: 400 }
      );
    }

    const slot = await prisma.home_featured_slot.findUnique({
      where: { id: slotId },
      select: { id: true },
    });
    if (!slot) {
      return NextResponse.json(
        { error: 'اسلات یافت نشد' },
        { status: 404 }
      );
    }

    await prisma.home_featured_slot.update({
      where: { id: slotId },
      data: { impressions: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Featured impression error:', err);
    return NextResponse.json(
      { error: 'خطا در ثبت نمایش' },
      { status: 500 }
    );
  }
}
