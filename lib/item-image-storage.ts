import { isOurStorageUrl, isLegacyLiaraStorageUrl } from '@/lib/object-storage-config';
import { isPlaceholderCoverPath } from '@/lib/image-url-policy';
import { toAbsoluteImageUrl } from '@/lib/seo';

/** banner یا banners در هر نقطهٔ URL (بدون حساسیت به حروف) */
export function hasBannerPathInUrl(url: string): boolean {
  return /banners?/i.test(url);
}

/** parspack در هر نقطهٔ URL (بدون حساسیت به حروف) */
export function hasParsPackInUrl(url: string): boolean {
  return /parspack/i.test(url);
}

/** URL تصویر روی ParsPack Object Storage (استوریج فعلی اپ) */
export function isAppObjectStorageImageUrl(url: string | null | undefined): boolean {
  return isOurStorageUrl(url || '');
}

/** @deprecated از isAppObjectStorageImageUrl استفاده کنید */
export function isLiaraObjectStorageImageUrl(url: string | null | undefined): boolean {
  return isAppObjectStorageImageUrl(url);
}

/**
 * تصویر با لینک مستقیم خارجی — نه ParsPack (شامل Liara قدیمی، TMDb، …)
 */
export function isExternalDirectImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t || isPlaceholderCoverPath(t)) return false;
  if (isAppObjectStorageImageUrl(t)) return false;
  return t.startsWith('http://') || t.startsWith('https://') || t.startsWith('//');
}

/**
 * آیا در لیست S3 نمایش داده شود؟
 * ۱) URL شامل banner یا banners باشد (هر حرف‌بندی)
 * ۲) یا هیچ‌جای URL کلمه parspack نباشد (هنوز روی استوریج اصلی نیست)
 */
export function needsS3MigrationImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t || isPlaceholderCoverPath(t)) return false;
  if (isAppObjectStorageImageUrl(t)) return false;

  if (hasBannerPathInUrl(t)) return true;
  if (!hasParsPackInUrl(t)) return true;

  return false;
}

/** تبدیل مسیر نسبی (مثل /images/banners/…) به URL مطلق برای دانلود/آپلود S3 */
export function resolveUrlForS3Migration(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (!t) return '';
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return toAbsoluteImageUrl(t) || t;
}

export function isLegacyExternalImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  return isLegacyLiaraStorageUrl(t) || isExternalDirectImageUrl(t);
}

export function getItemEffectiveImageUrl(input: {
  imageUrl?: string | null;
  catalogImageUrl?: string | null;
}): string {
  if (typeof input.imageUrl === 'string' && input.imageUrl.trim()) {
    return input.imageUrl.trim();
  }
  if (typeof input.catalogImageUrl === 'string' && input.catalogImageUrl.trim()) {
    return input.catalogImageUrl.trim();
  }
  return '';
}

export function itemUsesExternalDirectImage(input: {
  imageUrl?: string | null;
  catalogImageUrl?: string | null;
}): boolean {
  return isExternalDirectImageUrl(getItemEffectiveImageUrl(input));
}

export function truncateImageUrl(url: string, max = 56): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

export function externalImageHost(url: string): string {
  if (url.startsWith('/')) {
    return hasBannerPathInUrl(url) ? 'banner/banners (محلی)' : 'محلی';
  }
  try {
    const host = new URL(url.startsWith('//') ? `https:${url}` : url).hostname;
    if (host.includes('parspack.net')) return 'ParsPack';
    if (host.includes('liara')) return 'Liara (قدیمی)';
    return host.replace(/^www\./, '');
  } catch {
    return '—';
  }
}
