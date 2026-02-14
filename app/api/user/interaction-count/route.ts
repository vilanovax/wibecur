import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/interaction-count
 * تعداد کل تعاملات کاربر (ذخیره + لایک لیست) برای شرط For You
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, data: { total: 0 } });
    }

    const userId = session.user.id;

    const [bookmarks, likes] = await Promise.all([
      prisma.bookmarks.count({ where: { userId } }),
      prisma.list_likes.count({ where: { userId } }),
    ]);

    const total = bookmarks + likes;

    return NextResponse.json({
      success: true,
      data: { total, bookmarks, likes },
    });
  } catch (error: unknown) {
    console.error('Interaction count error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message ?? 'خطا' },
      { status: 500 }
    );
  }
}
