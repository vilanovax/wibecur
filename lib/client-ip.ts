/**
 * آدرس کلاینت برای محدودیت نرخ و بازدید.
 *
 * اولین مقدار X-Forwarded-For را خود درخواست می‌تواند جعل کند.
 * فقط به تعداد پروکسی مورد اعتماد از انتهای زنجیره اعتماد می‌کنیم؛
 * آن پرش را خود پروکسی اضافه کرده است. اگر هدر نباشد، همه در سطل unknown
 * جمع می‌شوند تا جعل هدر سطل تازه نسازد.
 *
 * TRUSTED_PROXY_COUNT پیش‌فرض ۱ است. صفر یعنی هدر نادیده گرفته شود.
 */

const DEFAULT_TRUSTED_PROXY_COUNT = 1;

type HeaderSource = {
  get(name: string): string | null;
};

export function trustedProxyCount(): number {
  const raw = process.env.TRUSTED_PROXY_COUNT;
  if (raw === undefined || raw.trim() === '') return DEFAULT_TRUSTED_PROXY_COUNT;
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 0) return DEFAULT_TRUSTED_PROXY_COUNT;
  return count;
}

export function getClientIp(headers: HeaderSource): string {
  const hops = trustedProxyCount();
  if (hops === 0) return 'unknown';

  const forwarded = headers.get('x-forwarded-for');
  if (!forwarded) return 'unknown';

  const parts = forwarded
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'unknown';

  const index = parts.length - hops;
  const ip = index < 0 ? parts[0] : parts[index];
  return ip || 'unknown';
}
