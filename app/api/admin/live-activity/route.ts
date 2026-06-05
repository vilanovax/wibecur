import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { checkAdminAuth } from '@/lib/auth';
import { getLiveActivityData, serializeLiveActivity } from '@/lib/admin/live-activity';

const CACHE_SECONDS = 10;

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const getCached = unstable_cache(
      async () => serializeLiveActivity(await getLiveActivityData()),
      ['admin-live-activity'],
      { revalidate: CACHE_SECONDS, tags: ['admin-live'] }
    );
    const data = await getCached();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Live activity error:', err);
    return NextResponse.json({ error: 'خطا در دریافت فعالیت زنده' }, { status: 500 });
  }
}
