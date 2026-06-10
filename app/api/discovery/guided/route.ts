import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { resolveSessionUserId, tryApiDbFallback } from '@/lib/api-db';
import {
  parseGuidedScenario,
  resolveGuidedContext,
} from '@/lib/discovery/guided-intent';
import { getGuidedDiscoveryResults } from '@/lib/discovery/guided-recommendations';

const EMPTY = { headline: '', scenario: 'bored' as const, rows: [] };

/**
 * GET /api/discovery/guided?scenario=weekend&location=out&timeBudget=30
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = parseGuidedScenario(searchParams.get('scenario'));
    if (!scenario) {
      return NextResponse.json(
        { success: false, error: 'پارامتر scenario نامعتبر است' },
        { status: 400 }
      );
    }

    const ctx = resolveGuidedContext(scenario, {
      location: searchParams.get('location'),
      timeBudget: searchParams.get('timeBudget'),
    });

    let userId: string | null = null;
    try {
      const session = await auth();
      if (session?.user) {
        userId = await resolveSessionUserId(session);
      }
    } catch {
      /* مهمان */
    }

    const data = await dbQuery(() => getGuidedDiscoveryResults(prisma, ctx, userId));

    const response = NextResponse.json({ success: true, data });
    response.headers.set(
      'Cache-Control',
      userId
        ? 'private, max-age=60, stale-while-revalidate=120'
        : 'public, max-age=120, stale-while-revalidate=300'
    );
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, EMPTY, 'Guided discovery');
    if (fb) return fb;
    console.error('Guided discovery error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message ?? 'خطا در دریافت پیشنهادها' },
      { status: 500 }
    );
  }
}
