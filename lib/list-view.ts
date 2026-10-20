import { prisma } from '@/lib/prisma';

/**
 * ثبت بازدید لیست.
 * نوشتن‌ها هر ده ثانیه دسته‌ای به پایگاه می‌روند (سرور standalone تک‌پروسه).
 * هر فهرست و هر آدرس در سی دقیقه فقط یک بازدید می‌سازد تا حلقهٔ POST عدد را بالا نبرد.
 */

const FLUSH_INTERVAL_MS = 10_000;
const VIEW_DEDUP_MS = 30 * 60 * 1000;
const SEEN_CAP = 20_000;

const viewBuffer = new Map<string, number>();
const seenUntil = new Map<string, number>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

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
          // اگر لیست حذف شده باشد یا پایگاه لحظه‌ای در دسترس نباشد، بازدید را رها کن.
        })
    )
  );
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    void flushViewBuffer();
  }, FLUSH_INTERVAL_MS);
  if (typeof flushTimer.unref === 'function') flushTimer.unref();
}

function pruneSeen(now: number): void {
  if (seenUntil.size <= SEEN_CAP) return;
  for (const [key, expiresAt] of seenUntil) {
    if (expiresAt <= now) seenUntil.delete(key);
  }
  while (seenUntil.size > SEEN_CAP) {
    const oldest = seenUntil.keys().next().value;
    if (oldest === undefined) break;
    seenUntil.delete(oldest);
  }
}

/** true یعنی این بار شمرده شد. تکرار داخل پنجره هم برای صفحه موفق است، ولی به شمارنده اضافه نمی‌شود. */
export function recordListView(listId: string, ip: string): boolean {
  if (!listId) return false;
  const caller = ip.trim() || 'unknown';
  const now = Date.now();
  const key = `${listId}\n${caller}`;
  const expiresAt = seenUntil.get(key);
  if (expiresAt !== undefined && expiresAt > now) {
    seenUntil.delete(key);
    seenUntil.set(key, expiresAt);
    return false;
  }

  seenUntil.delete(key);
  seenUntil.set(key, now + VIEW_DEDUP_MS);
  pruneSeen(now);
  viewBuffer.set(listId, (viewBuffer.get(listId) ?? 0) + 1);
  scheduleFlush();
  return true;
}

export function bufferedViewCount(listId: string): number {
  return viewBuffer.get(listId) ?? 0;
}

export function resetListViewsForTests(): void {
  viewBuffer.clear();
  seenUntil.clear();
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
