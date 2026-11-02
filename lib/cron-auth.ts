/**
 * احراز هویت endpointهای cron — fail-closed.
 * اگر CRON_SECRET (یا REVALIDATE_SECRET) تنظیم نشده باشد، درخواست رد می‌شود
 * تا endpoint هرگز به‌صورت عمومی باز نماند.
 */
import { createHash, timingSafeEqual } from 'node:crypto';

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function resolveCronSecret(): string {
  return (process.env.CRON_SECRET || process.env.REVALIDATE_SECRET || '').trim();
}

export function authorizeCron(request: Request): CronAuthResult {
  const expected = resolveCronSecret();
  if (!expected) {
    // پیکربندی ناقص → بستن endpoint به‌جای باز گذاشتن آن.
    return { ok: false, status: 503, error: 'Cron secret not configured' };
  }
  const authHeader = request.headers.get('authorization');
  const secret = authHeader?.replace(/^Bearer\s+/i, '').trim() ?? '';
  const matches = timingSafeEqual(digest(secret), digest(expected));
  if (!matches) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  return { ok: true };
}
