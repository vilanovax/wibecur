/**
 * تنظیمات و helperهای SEO
 */
export const SITE_NAME = 'WibeCur';
export const SITE_DESCRIPTION =
  'کشف و اشتراک‌گذاری لیست‌های کیوریتد در حوزه لایف‌استایل - فیلم، کتاب، رستوران، سفر و بیشتر';
export const SITE_KEYWORDS = [
  'لیست کیوریتد',
  'لایف استایل',
  'فیلم',
  'کتاب',
  'رستوران',
  'سفر',
  'وایب‌کر',
  'WibeCur',
  'کیوریتور',
].join(', ');

/** آدرس پایه سایت - برای تصاویر OG و JSON-LD */
export function getBaseUrl(): string {
  if (typeof process !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://wibecur.ir'
    );
  }
  return 'https://wibecur.ir';
}

/** تبدیل مسیر/URL تصویر به آدرس مطلق برای Open Graph */
export function toAbsoluteImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  const base = getBaseUrl().replace(/\/$/, '');
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${base}${path}`;
}
