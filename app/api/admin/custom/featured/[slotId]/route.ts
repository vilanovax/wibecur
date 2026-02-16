import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';

/**
 * PATCH /api/admin/custom/featured/[slotId]
 * ویرایش اسلات: startAt، endAt، listId (اختیاری). اعتبارسنجی تداخل.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { slotId } = await params;
    const body = await request.json();
    const { listId, startAt, endAt } = body;

    const existing = await prisma.home_featured_slot.findUnique({
      where: { id: slotId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'اسلات یافت نشد' },
        { status: 404 }
      );
    }

    const start = startAt != null ? new Date(startAt) : existing.startAt;
    const end = endAt !== undefined ? (endAt == null ? null : new Date(endAt)) : existing.endAt;
    const list = listId ?? existing.listId;

    if (startAt != null && isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'تاریخ شروع نامعتبر است' },
        { status: 400 }
      );
    }
    if (end !== null && (isNaN(end.getTime()) || end <= start)) {
      return NextResponse.json(
        { error: 'تاریخ پایان نامعتبر یا باید بعد از شروع باشد' },
        { status: 400 }
      );
    }

    if (listId) {
      const listExists = await prisma.lists.findUnique({
        where: { id: list },
        select: { id: true },
      });
      if (!listExists) {
        return NextResponse.json(
          { error: 'لیست یافت نشد' },
          { status: 404 }
        );
      }
    }

    const farFuture = new Date('2099-12-31T23:59:59Z');
    const myEnd = end ?? farFuture;
    const overlapping = await prisma.home_featured_slot.findFirst({
      where: {
        id: { not: slotId },
        startAt: { lt: myEnd },
        OR: [{ endAt: null }, { endAt: { gt: start } }],
      },
    });
    if (overlapping) {
      return NextResponse.json(
        { error: 'این بازه با اسلات دیگر تداخل دارد.' },
        { status: 400 }
      );
    }

    const updated = await prisma.home_featured_slot.update({
      where: { id: slotId },
      data: {
        ...(listId && { listId: list }),
        ...(startAt != null && { startAt: start }),
        ...(endAt !== undefined && { endAt: end }),
      },
      include: {
        lists: {
          select: {
            id: true,
            title: true,
            slug: true,
            saveCount: true,
            categories: { select: { name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      slot: {
        id: updated.id,
        listId: updated.listId,
        list: updated.lists,
        startAt: updated.startAt.toISOString(),
        endAt: updated.endAt?.toISOString() ?? null,
        orderIndex: updated.orderIndex,
      },
    });
  } catch (err: unknown) {
    console.error('Admin featured PATCH error:', err);
    return NextResponse.json(
      { error: 'خطا در ویرایش اسلات' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/custom/featured/[slotId]
 * حذف اسلات (رویدادها با onDelete: Cascade حذف می‌شوند).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { slotId } = await params;

    const existing = await prisma.home_featured_slot.findUnique({
      where: { id: slotId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'اسلات یافت نشد' },
        { status: 404 }
      );
    }

    await prisma.home_featured_slot.delete({
      where: { id: slotId },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Admin featured DELETE error:', err);
    return NextResponse.json(
      { error: 'خطا در حذف اسلات' },
      { status: 500 }
    );
  }
}
