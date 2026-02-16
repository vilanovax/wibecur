import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';

/**
 * GET /api/admin/custom/featured/check-conflict?startAt=&endAt=&excludeId=
 * بررسی تداخل بازهٔ جدید با اسلات‌های موجود.
 * قانون: overlap اگر existing.endAt >= newStart AND existing.startAt <= newEnd
 * (endAt null = تا بی‌نهایت در نظر گرفته می‌شود)
 */
export async function GET(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(request.url);
    const startAt = searchParams.get('startAt');
    const endAtParam = searchParams.get('endAt');
    const excludeId = searchParams.get('excludeId') ?? undefined;

    if (!startAt) {
      return NextResponse.json(
        { error: 'startAt الزامی است' },
        { status: 400 }
      );
    }

    const newStart = new Date(startAt);
    if (isNaN(newStart.getTime())) {
      return NextResponse.json(
        { error: 'تاریخ شروع نامعتبر است' },
        { status: 400 }
      );
    }

    const newEnd = endAtParam ? new Date(endAtParam) : new Date('2099-12-31T23:59:59Z');
    if (isNaN(newEnd.getTime()) || newEnd <= newStart) {
      return NextResponse.json(
        { conflict: false, error: 'تاریخ پایان نامعتبر یا قبل از شروع است' },
        { status: 200 }
      );
    }

    const overlapping = await prisma.home_featured_slot.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startAt: { lte: newEnd },
        OR: [
          { endAt: null },
          { endAt: { gte: newStart } },
        ],
      },
      include: {
        lists: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!overlapping) {
      return NextResponse.json({ conflict: false });
    }

    return NextResponse.json({
      conflict: true,
      conflictingSlot: {
        id: overlapping.id,
        title: overlapping.lists?.title ?? '—',
        startAt: overlapping.startAt instanceof Date ? overlapping.startAt.toISOString() : String(overlapping.startAt),
        endAt: overlapping.endAt == null ? null : (overlapping.endAt instanceof Date ? overlapping.endAt.toISOString() : String(overlapping.endAt)),
      },
    });
  } catch (err: unknown) {
    console.error('Featured check-conflict error:', err);
    return NextResponse.json(
      { error: 'خطا در بررسی تداخل', conflict: false },
      { status: 500 }
    );
  }
}
