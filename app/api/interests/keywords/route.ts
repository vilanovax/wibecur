import { NextResponse } from 'next/server';
import { groupInterestKeywords } from '@/lib/interest-keywords';

/** GET /api/interests/keywords — کاتالوگ ثابت، بدون DB */
export async function GET() {
  const groups = groupInterestKeywords();
  return NextResponse.json(
    { success: true, data: { groups } },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    }
  );
}
