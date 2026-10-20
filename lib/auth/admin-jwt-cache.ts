/**
 * میان‌افزار برای هر درخواست ادمین jwt را صدا می‌زند.
 * بدون این کش، هر ناوبری یک کوئری users می‌زند و استخر اتصال را پر می‌کند.
 */

const SUCCESS_TTL_MS = 60_000;
const FAILURE_TTL_MS = 15_000;

export type AdminJwtSnapshot = {
  role: string;
  isActive: boolean;
  adminPermissions: string[] | null;
  deletedAt: Date | null;
};

type Entry = {
  expiresAt: number;
  row: AdminJwtSnapshot | null;
};

const cache = new Map<string, Entry>();

/** undefined یعنی باید از دیتابیس خواند. null یعنی تلاش اخیر شکست خورده و توکن فعلی بماند. */
export function readAdminJwtCache(
  userId: string,
  now = Date.now()
): AdminJwtSnapshot | null | undefined {
  const hit = cache.get(userId);
  if (!hit || hit.expiresAt <= now) return undefined;
  return hit.row;
}

export function rememberAdminJwtCache(
  userId: string,
  row: AdminJwtSnapshot | null,
  now = Date.now()
): void {
  cache.set(userId, {
    row,
    expiresAt: now + (row ? SUCCESS_TTL_MS : FAILURE_TTL_MS),
  });
}

export function clearAdminJwtCache(): void {
  cache.clear();
}
