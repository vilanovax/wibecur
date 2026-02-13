import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSpotlightWithDetails } from '@/lib/spotlight';

/** GET /api/spotlight/current — اسپاتلایت کیوریتور فعلی (همه می‌بینند، بدون لاگین) */
export async function GET() {
  try {
    const data = await getCurrentSpotlightWithDetails(prisma);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Spotlight current error:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
