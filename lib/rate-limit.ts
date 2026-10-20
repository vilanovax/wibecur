/**
 * محدودیت نرخ در حافظهٔ همین پروسه.
 * برای سرور تک‌پروسه کافی است؛ بین چند نمونه مشترک نمی‌شود.
 */

const WINDOW_MS = { s: 1000, m: 60_000, h: 3_600_000 } as const;

/** سقف گشاد میان‌افزار؛ هر صفحه چند درخواست API می‌زند. */
export const API_RATE_LIMIT_MAX = 300;
export const API_RATE_LIMIT_WINDOW = '1 m' as const;

/** خواندن سشن جدا از بودجهٔ صفحه است تا گالری و داشبورد کاربر را از حساب خارج نکنند. */
export const SESSION_RATE_LIMIT_MAX = 120;
/** هر تصویر یک GET است؛ نباید سقف APIهای تعاملی را پر کند. */
export const IMAGE_RATE_LIMIT_MAX = 2_000;

export type ApiRateBucket = 'default' | 'session' | 'image';

const API_RATE_BUCKETS: Record<ApiRateBucket, { max: number; window: RateWindow }> = {
  default: { max: API_RATE_LIMIT_MAX, window: API_RATE_LIMIT_WINDOW },
  session: { max: SESSION_RATE_LIMIT_MAX, window: API_RATE_LIMIT_WINDOW },
  image: { max: IMAGE_RATE_LIMIT_MAX, window: API_RATE_LIMIT_WINDOW },
};

/** سشن و پروکسی تصویر سطل جدا دارند. ورود و بقیهٔ APIها روی سطل پیش‌فرض می‌مانند. */
export function apiRateBucket(pathname: string, method: string): ApiRateBucket {
  if (pathname === '/api/auth/session' || pathname.startsWith('/api/auth/session/')) {
    return 'session';
  }
  if (
    method === 'GET' &&
    (pathname === '/api/liara-image' || pathname === '/api/storage-image')
  ) {
    return 'image';
  }
  return 'default';
}

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

export async function checkApiRateLimit(
  bucket: ApiRateBucket,
  ip: string
): Promise<{ success: boolean }> {
  const limit = API_RATE_BUCKETS[bucket];
  return limiter.check(`${bucket}:${ip}`, limit.max, limit.window);
}

export async function checkActionRateLimit(
  identifier: string,
  max: number,
  window: RateWindow
): Promise<{ success: boolean }> {
  return limiter.check(identifier, max, window);
}
