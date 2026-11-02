import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeCron } from '@/lib/cron-auth';
import { logServerError } from '@/lib/api-error';
import {
  parseDiscoveryCronParams,
  runDiscoveryAffinityBatch,
} from '@/lib/discovery-cron';

/**
 * POST /api/cron/discovery — به‌روزرسانی وزن دسته‌ای کاربران (دسته‌ای).
 *
 * Query:
 * - limit (پیش‌فرض ۵۰، سقف ۵۰۰)
 * - cursor (آخرین userId پردازش‌شده از پاسخ قبلی)
 * - concurrency (پیش‌فرض ۵، سقف ۲۰)
 *
 * تا hasMore=false صدا را با nextCursor تکرار کن.
 */
export async function POST(request: NextRequest) {
  const authResult = authorizeCron(request);
  if (!authResult.ok) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  try {
    const params = parseDiscoveryCronParams(request);
    const result = await runDiscoveryAffinityBatch(prisma, params);

    return NextResponse.json({
      success: true,
      message: `Discovery affinity updated for ${result.processed} users`,
      ...result,
    });
  } catch (e) {
    logServerError('cron/discovery', e);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
