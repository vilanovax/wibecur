import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { checkAdminAuth } from '@/lib/auth';

const CACHE_SECONDS = 300;

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const getCached = unstable_cache(
      async () => [],
      ['admin-pulse-cities'],
      { revalidate: CACHE_SECONDS, tags: ['admin-pulse'] }
    );
    const data = await getCached();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Pulse cities error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت شهرها' },
      { status: 500 }
    );
  }
}
