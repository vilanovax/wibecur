import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateAllRanks } from '@/lib/ranking';

const CRON_SECRET = process.env.CRON_SECRET || process.env.REVALIDATE_SECRET;

/** POST /api/cron/ranking — به‌روزرسانی رتبه‌های همه کریتورها (روزانه از cron صدا بزن). */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (CRON_SECRET && secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await updateAllRanks(prisma);
    return NextResponse.json({ success: true, message: 'Ranking updated' });
  } catch (e) {
    console.error('Cron ranking error:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
