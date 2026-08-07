import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getHomeRecommendationsForUser } from '@/lib/home-recommendations';
import { tryApiDbFallback } from '@/lib/api-db';

const EMPTY = { lists: [] as unknown[], isPersonalized: false };

function parseInterestSlugs(request: NextRequest): string[] {
  const raw = request.nextUrl.searchParams.get('interests');
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

/**
 * GET /api/lists/home/for-you
 * پیشنهادهای شخصی‌سازی‌شده برای تب «برای تو»
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const interestSlugs = parseInterestSlugs(request);

    const result = await dbQuery(() =>
      getHomeRecommendationsForUser(prisma, userId, 8, interestSlugs)
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
      { success: false, error: getClientErrorMessage(error, 'خطا در دریافت پیشنهادها') },
      { status: 500 }
    );
  }
}
