import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getPublicProfilePicksForUser } from '@/lib/profile-picks';

/** GET /api/users/[username]/profile-picks */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const raw = (username || '').trim().toLowerCase();
    if (!raw) {
      return NextResponse.json({ success: false, error: 'نام کاربری نامعتبر' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { username: raw },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const shelves = await dbQuery(() => getPublicProfilePicksForUser(user.id));
    return NextResponse.json({ success: true, data: { shelves } });
  } catch (error) {
    console.error('public profile-picks:', error);
    return NextResponse.json({ success: false, error: 'خطا در بارگذاری منتخب‌ها' }, { status: 500 });
  }
}
