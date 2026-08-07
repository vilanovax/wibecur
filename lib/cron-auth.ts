/**
 * احراز هویت endpointهای cron — fail-closed.
 * اگر CRON_SECRET (یا REVALIDATE_SECRET) تنظیم نشده باشد، درخواست رد می‌شود
 * تا endpoint هرگز به‌صورت عمومی باز نماند.
 */
const CRON_SECRET = process.env.CRON_SECRET || process.env.REVALIDATE_SECRET;

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

export function authorizeCron(request: Request): CronAuthResult {
  if (!CRON_SECRET) {
    // پیکربندی ناقص → بستن endpoint به‌جای باز گذاشتن آن.
    return { ok: false, status: 503, error: 'Cron secret not configured' };
  }
  const authHeader = request.headers.get('authorization');
  const secret = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (secret !== CRON_SECRET) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  return { ok: true };
}
