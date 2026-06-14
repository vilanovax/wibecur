import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getCachedLiveActivity } from '@/lib/admin/live-activity';

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await getCachedLiveActivity();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Live activity error:', err);
    return NextResponse.json({ error: 'خطا در دریافت فعالیت زنده' }, { status: 500 });
  }
}
