/**
 * Rate limiting برای API
 * از Upstash Redis استفاده می‌کند. اگر UPSTASH_REDIS_REST_URL و
 * UPSTASH_REDIS_REST_TOKEN تنظیم نشده باشند، rate limiting غیرفعال است.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 درخواست در دقیقه به ازای هر IP
    analytics: true,
  });
  return ratelimit;
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const rl = getRatelimit();
  if (!rl) return { success: true };
  const { success } = await rl.limit(identifier);
  return { success };
}

/**
 * Rate limit سفارشی به‌ازای اکشن/کاربر (مثلاً endpointهای گران: آپلود، AI، جستجوی تصویر).
 * نمونه‌های Ratelimit بر اساس (max:window) کش می‌شوند. اگر Upstash تنظیم نباشد، غیرفعال است.
 */
const actionLimiters = new Map<string, Ratelimit>();

function getActionRatelimit(max: number, window: `${number} ${'s' | 'm' | 'h'}`) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const key = `${max}:${window}`;
  let rl = actionLimiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(max, window),
      analytics: true,
    });
    actionLimiters.set(key, rl);
  }
  return rl;
}

export async function checkActionRateLimit(
  identifier: string,
  max: number,
  window: `${number} ${'s' | 'm' | 'h'}`
): Promise<{ success: boolean }> {
  const rl = getActionRatelimit(max, window);
  if (!rl) return { success: true };
  const { success } = await rl.limit(identifier);
  return { success };
}
