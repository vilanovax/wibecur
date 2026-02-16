import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-config';
import { trackFeaturedEvent } from '@/lib/home-featured';

/**
 * POST /api/home-featured/track
 * ثبت کلیک روی «مشاهده لیست» یا «ذخیره سریع» در هیرو منتخب هفته.
 * body: { slotId: string, listId: string, action: 'view_list' | 'quick_save' }
 * احراز هویت اختیاری؛ اگر کاربر لاگین است userId پر می‌شود.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotId, listId, action } = body;

    if (!slotId || !listId || !action) {
      return NextResponse.json(
        { error: 'slotId، listId و action الزامی هستند' },
        { status: 400 }
      );
    }

    const normalizedAction =
      action === 'view_list' ? 'VIEW_LIST' : action === 'quick_save' ? 'QUICK_SAVE' : null;
    if (!normalizedAction) {
      return NextResponse.json(
        { error: 'action باید view_list یا quick_save باشد' },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;

    const slot = await prisma.home_featured_slot.findUnique({
      where: { id: slotId },
      select: { id: true, listId: true },
    });
    if (!slot || slot.listId !== listId) {
      return NextResponse.json(
        { error: 'اسلات یا لیست نامعتبر است' },
        { status: 400 }
      );
    }

    await trackFeaturedEvent(prisma, {
      slotId,
      listId,
      action: normalizedAction,
      userId,
    });

    if (normalizedAction === 'VIEW_LIST') {
      await prisma.home_featured_slot.update({
        where: { id: slotId },
        data: { clicks: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Home featured track error:', err);
    return NextResponse.json(
      { error: 'خطا در ثبت رویداد' },
      { status: 500 }
    );
  }
}
