import { isOurStorageUrl } from '@/lib/object-storage-config';

/**
 * نحوهٔ تحویل تصویر Liara به مرورگر:
 * - same-origin: از API خود اپ (سرور با S3 لیارا می‌خواند) — وقتی CDN لیارا از شبکهٔ کاربر block است
 * - direct: URL عمومی storage.*.liara.space
 */
export type LiaraImageMode = 'same-origin' | 'direct';

export function getLiaraImageMode(): LiaraImageMode {
  const mode = process.env.NEXT_PUBLIC_LIARA_IMAGE_MODE;
  if (mode === 'direct') return 'direct';
  return 'same-origin';
}

/** آدرس نهایی <img> — فقط برای URLهای Liara */
export function toLiaraImageSrc(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return '';
  const url = rawUrl.trim();
  if (url.startsWith('/')) return url;
  if (!isOurStorageUrl(url)) return '';

  if (getLiaraImageMode() === 'direct') return url;

  return `/api/liara-image?url=${encodeURIComponent(url)}`;
}
