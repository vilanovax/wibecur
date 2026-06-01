import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getHomeRecommendationsForUser } from '@/lib/home-recommendations';
import { tryApiDbFallback } from '@/lib/api-db';

const EMPTY = { lists: [] as unknown[], isPersonalized: false };

/**
 * GET /api/lists/home/for-you
 * پیشنهادهای شخصی‌سازی‌شده برای تب «برای تو»
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const result = await dbQuery(() =>
      getHomeRecommendationsForUser(prisma, userId, 6)
    );

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    if (userId) {
      response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }

    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, EMPTY, 'Home for-you');
    if (fb) return fb;
    console.error('Home for-you error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message ?? 'خطا در دریافت پیشنهادها' },
      { status: 500 }
    );
  }
}
