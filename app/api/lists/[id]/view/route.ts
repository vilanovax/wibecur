import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * POST /api/lists/[id]/view
 * ثبت بازدید لیست — خارج از مسیر رندر تا صفحه بتواند static/ISR بماند.
 * write‌ها در حافظه بافر و به‌صورت دسته‌ای (batch) هر چند ثانیه یک‌بار flush می‌شوند
 * تا فشار write روی connection pool محدود کم شود (سرور standalone تک‌پروسه).
 */
const viewBuffer = new Map<string, number>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 10_000;

async function flushViewBuffer(): Promise<void> {
  flushTimer = null;
  if (viewBuffer.size === 0) return;

  const entries = [...viewBuffer.entries()];
  viewBuffer.clear();

  await Promise.all(
    entries.map(([id, count]) =>
      prisma.lists
        .update({ where: { id }, data: { viewCount: { increment: count } } })
        .catch(() => {
          // اگر لیست حذف شده باشد یا DB لحظه‌ای در دسترس نباشد، بازدید را بی‌خیال شو.
        })
    )
  );
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    void flushViewBuffer();
  }, FLUSH_INTERVAL_MS);
  // نگذار این تایمر مانع خروج پروسه شود.
  if (typeof flushTimer.unref === 'function') flushTimer.unref();
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  viewBuffer.set(id, (viewBuffer.get(id) ?? 0) + 1);
  scheduleFlush();

  return NextResponse.json({ success: true });
}
