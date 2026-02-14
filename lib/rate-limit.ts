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
