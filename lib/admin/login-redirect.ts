/** ساخت URL ورود ادمین با بازگشت به مسیر فعلی */
export function buildAdminLoginUrl(callbackPath?: string | null): string {
  const raw = (callbackPath || '/admin/dashboard').trim() || '/admin/dashboard';
  const safe = raw.startsWith('/admin') ? raw : '/admin/dashboard';
  return `/login?callbackUrl=${encodeURIComponent(safe)}`;
}
