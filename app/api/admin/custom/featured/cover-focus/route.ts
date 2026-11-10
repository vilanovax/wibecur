import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { revalidateAdminFeaturedCache } from '@/lib/admin/admin-cache';
import { normalizeCoverFocus } from '@/lib/cover-focus';

/**
 * PATCH /api/admin/custom/featured/cover-focus
 * ذخیرهٔ نقطهٔ فوکوس کاور لیست برای کراپ هیرو موبایل.
 */
export async function PATCH(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await request.json();
    const listId = typeof body.listId === 'string' ? body.listId.trim() : '';
    if (!listId) {
      return NextResponse.json({ error: 'شناسهٔ لیست لازم است' }, { status: 400 });
    }

    const focus = normalizeCoverFocus({
      coverFocusX: body.coverFocusX,
      coverFocusY: body.coverFocusY,
    });

    const existing = await prisma.lists.findUnique({
      where: { id: listId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
    }

    const updated = await prisma.lists.update({
      where: { id: listId },
      data: {
        coverFocusX: focus.coverFocusX,
        coverFocusY: focus.coverFocusY,
      },
      select: {
        id: true,
        coverFocusX: true,
        coverFocusY: true,
      },
    });

    revalidateAdminFeaturedCache();

    return NextResponse.json({
      success: true,
      listId: updated.id,
      coverFocusX: updated.coverFocusX,
      coverFocusY: updated.coverFocusY,
    });
  } catch (err: unknown) {
    console.error('Admin featured cover-focus PATCH error:', err);
    return NextResponse.json(
      { error: 'خطا در ذخیرهٔ فوکوس تصویر' },
      { status: 500 }
    );
  }
}
