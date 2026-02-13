import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

/** GET /api/follow/following — لیست کاربرانی که من دنبال می‌کنم (برای تب Following در فید) */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, data: { userIds: [] } });
    }

    const rows = await prisma.follows.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const userIds = rows.map((r) => r.followingId);

    return NextResponse.json({
      success: true,
      data: { userIds },
    });
  } catch (error: unknown) {
    console.error('Following list error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
