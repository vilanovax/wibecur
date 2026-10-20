/**
 * محدودیت نرخ در حافظهٔ همین پروسه.
 * برای سرور تک‌پروسه کافی است؛ بین چند نمونه مشترک نمی‌شود.
 */

const WINDOW_MS = { s: 1000, m: 60_000, h: 3_600_000 } as const;

/** سقف گشاد میان‌افزار؛ هر صفحه چند درخواست API می‌زند. */
export const API_RATE_LIMIT_MAX = 300;
export const API_RATE_LIMIT_WINDOW = '1 m' as const;

const DEFAULT_BUCKET_CAP = 5_000;

type RateWindow = `${number} ${'s' | 'm' | 'h'}`;

type Bucket = {
  count: number;
  resetAt: number;
};

export function rateWindowMs(window: RateWindow): number {
  const match = /^(\d+) ([smh])$/.exec(window);
  if (!match) return WINDOW_MS.m;
  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof WINDOW_MS;
  if (!Number.isFinite(amount) || amount <= 0) return WINDOW_MS.m;
  return amount * WINDOW_MS[unit];
}

export function createRateLimiter(options?: { maxBuckets?: number; now?: () => number }) {
  const buckets = new Map<string, Bucket>();
  const maxBuckets = options?.maxBuckets ?? DEFAULT_BUCKET_CAP;
  const now = options?.now ?? (() => Date.now());

  function remember(key: string, bucket: Bucket, at: number) {
    buckets.delete(key);
    buckets.set(key, bucket);
    if (buckets.size <= maxBuckets) return;

    for (const [storedKey, stored] of buckets) {
      if (stored.resetAt <= at) buckets.delete(storedKey);
    }
    while (buckets.size > maxBuckets) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined) break;
      buckets.delete(oldest);
    }
  }

  async function check(
    identifier: string,
    max: number,
    window: RateWindow
  ): Promise<{ success: boolean }> {
    const at = now();
    const windowMs = rateWindowMs(window);
    let bucket = buckets.get(identifier);
    if (!bucket || at >= bucket.resetAt) {
      bucket = { count: 0, resetAt: at + windowMs };
    }
    if (bucket.count >= max) {
      remember(identifier, bucket, at);
      return { success: false };
    }
    bucket.count += 1;
    remember(identifier, bucket, at);
    return { success: true };
  }

  return {
    check,
    clear() {
      buckets.clear();
    },
    size() {
      return buckets.size;
    },
  };
}

const limiter = createRateLimiter();

export function clearRateLimitsForTests(): void {
  limiter.clear();
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  return limiter.check(identifier, API_RATE_LIMIT_MAX, API_RATE_LIMIT_WINDOW);
}

export async function checkActionRateLimit(
  identifier: string,
  max: number,
  window: RateWindow
): Promise<{ success: boolean }> {
  return limiter.check(identifier, max, window);
}
