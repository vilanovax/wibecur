import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { tryApiDbFallback } from '@/lib/api-db';

/**
 * GET /api/user/interaction-count
 * تعداد کل تعاملات کاربر (ذخیره + لایک لیست) برای شرط For You
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, data: { total: 0, bookmarks: 0, likes: 0 } });
    }

    const userId = session.user.id;

    const [bookmarks, likes] = await dbQuery(() =>
      Promise.all([
        prisma.bookmarks.count({ where: { userId } }),
        prisma.list_likes.count({ where: { userId } }),
      ])
    );

    return NextResponse.json({
      success: true,
      data: { total: bookmarks + likes, bookmarks, likes },
    });
  } catch (error: unknown) {
    const fb = tryApiDbFallback(
      error,
      { total: 0, bookmarks: 0, likes: 0 },
      'Interaction count'
    );
    if (fb) return fb;
    console.error('Interaction count error:', error);
    return NextResponse.json({ success: true, data: { total: 0, bookmarks: 0, likes: 0 } });
  }
}
