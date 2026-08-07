import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateAllRanks } from '@/lib/ranking';
import { authorizeCron } from '@/lib/cron-auth';
import { logServerError } from '@/lib/api-error';

/** POST /api/cron/ranking — به‌روزرسانی رتبه‌های همه کریتورها (روزانه از cron صدا بزن). */
export async function POST(request: NextRequest) {
  const authResult = authorizeCron(request);
  if (!authResult.ok) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  try {
    await updateAllRanks(prisma);
    return NextResponse.json({ success: true, message: 'Ranking updated' });
  } catch (e) {
    logServerError('cron/ranking', e);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
