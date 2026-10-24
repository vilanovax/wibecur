/** تنظیمات Umami — از متغیرهای محیطی عمومی */
export function getUmamiWebsiteId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  return id || undefined;
}

export function getUmamiScriptUrl(): string {
  const custom = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim();
  if (custom) return custom;
  return 'https://umami.dpazone.ir/script.js';
}

/** آدرس API — اگر اسکریپت از CDN جدا لود شود (data-host-url) */
export function getUmamiHostUrl(): string | undefined {
  const custom = process.env.NEXT_PUBLIC_UMAMI_HOST_URL?.trim();
  if (custom) return custom.replace(/\/$/, '');
  const scriptUrl = getUmamiScriptUrl();
  try {
    return new URL(scriptUrl).origin;
  } catch {
    return undefined;
  }
}

export function isUmamiEnabled(): boolean {
  return !!getUmamiWebsiteId();
}

const LOCAL_ANALYTICS_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const UMAMI_MAX_PER_MINUTE = 20;
const umamiSentAt: number[] = [];

/** پنل ادمین ترافیک داخلی زیاد دارد و به آمار محصول مربوط نیست. */
export function shouldTrackUmamiPath(pathname: string): boolean {
  return pathname !== '/admin' && !pathname.startsWith('/admin/');
}

/** سقف ارسال هر زبانه تا یک حلقه یا تایپ سریع سهمیهٔ سایت را پر نکند. */
export function allowUmamiSend(now = Date.now(), recent = umamiSentAt): boolean {
  const fresh = recent.filter((at) => now - at < 60_000);
  recent.length = 0;
  recent.push(...fresh);
  if (recent.length >= UMAMI_MAX_PER_MINUTE) return false;
  recent.push(now);
  return true;
}

/** لوکال فقط وقتی در NEXT_PUBLIC_UMAMI_DOMAINS آمده باشد رویداد می‌فرستد. */
export function shouldTrackUmamiHost(hostname: string, domains?: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  const allowed = (domains ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length > 0) return allowed.includes(host);
  return !LOCAL_ANALYTICS_HOSTS.has(host);
}

function normalizeEventData(
  data?: Record<string, string | number | boolean>
): Record<string, string | number> | undefined {
  if (!data) return undefined;
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'boolean' ? (value ? '1' : '0') : value,
    ])
  );
}

function canSendFromHere(): boolean {
  if (typeof window === 'undefined' || !isUmamiEnabled()) return false;
  if (!shouldTrackUmamiPath(window.location.pathname)) return false;
  return allowUmamiSend();
}

/** رویداد سفارشی در Umami (فقط کلاینت) */
export function trackUmamiEvent(
  event: string,
  data?: Record<string, string | number | boolean>
): void {
  if (!canSendFromHere()) return;
  try {
    window.umami?.track(event, normalizeEventData(data));
  } catch {
    /* analytics نباید UX را بشکند */
  }
}

let lastUmamiPath = '';
let lastUmamiPathAt = 0;

/** بازدید صفحه فقط با عوض شدن مسیر، نه کوئری فیلتر و جستجو. */
export function trackUmamiPageView(url: string): void {
  const path = url.split('?')[0].split('#')[0] || '/';
  if (!shouldTrackUmamiPath(path)) return;
  const now = Date.now();
  if (path === lastUmamiPath && now - lastUmamiPathAt < 30_000) return;
  if (!canSendFromHere()) return;
  lastUmamiPath = path;
  lastUmamiPathAt = now;
  try {
    window.umami?.track((props) => ({ ...props, url: path }));
  } catch {
    /* ignore */
  }
}
