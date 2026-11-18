import { normalizeSearchQuery } from '@/lib/list-search';

/** نرمال‌سازی متن برای match موضوع کشف */
export function normalizeDiscoveryText(raw: string): string {
  return normalizeSearchQuery(raw)
    .replace(/‌/g, '') // ZWNJ
    .replace(/ـ/g, '')
    .toLowerCase();
}

/** جدا کردن فیلدهای ترکیبی مثل «سوخاری | برگر» یا «ایتالیایی، پیتزا» */
export function splitDiscoveryField(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(/[,،|/]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * آیا `haystack` شامل عبارت `needle` به‌صورت معنادار است؟
 * از match روی زیررشته‌های خیلی کوتاه جلوگیری می‌کند.
 */
export function textIncludesPhrase(haystack: string, needle: string): boolean {
  const h = normalizeDiscoveryText(haystack);
  const n = normalizeDiscoveryText(needle);
  if (!h || !n || n.length < 2) return false;
  if (h === n) return true;
  if (h.includes(n)) {
    // برای کلمات کوتاه (≤۳) مرز واژه تقریبی بخواه
    if (n.length <= 3) {
      const re = new RegExp(`(^|\\s|_)${escapeRegExp(n)}(\\s|_|$)`);
      return re.test(h);
    }
    return true;
  }
  return false;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
