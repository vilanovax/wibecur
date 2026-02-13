import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import {
  getRecommendedCreators,
  computeAndUpsertUserCategoryAffinity,
} from '@/lib/discovery';

const CACHE_EMPTY_OK = true;

/** GET /api/discovery/creators — پیشنهاد کیوریتورها برای کاربر لاگین‌شده */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const hasAffinity = await prisma.user_category_affinity.count({
      where: { userId },
    });
    if (hasAffinity === 0) {
      await computeAndUpsertUserCategoryAffinity(prisma, userId);
    }

    const creators = await getRecommendedCreators(prisma, userId, 10);
    if (creators.length === 0 && !CACHE_EMPTY_OK) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: creators });
  } catch (e) {
    console.error('Discovery creators error:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
