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

/** رویداد سفارشی در Umami (فقط کلاینت) */
export function trackUmamiEvent(
  event: string,
  data?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined' || !isUmamiEnabled()) return;
  try {
    window.umami?.track(event, normalizeEventData(data));
  } catch {
    /* analytics نباید UX را بشکند */
  }
}

/** بازدید صفحه در ناوبری کلاینت Next.js */
export function trackUmamiPageView(url: string): void {
  if (typeof window === 'undefined' || !isUmamiEnabled()) return;
  try {
    window.umami?.track((props) => ({ ...props, url }));
  } catch {
    /* ignore */
  }
}
