import { isOurStorageUrl } from '@/lib/object-storage-config';
import { isValidHttpImageUrl, unwrapStoredImageProxy } from '@/lib/image-url-sanitize';

/**
 * تصویر استوریج همیشه با URL عمومی خودش به مرورگر می‌رسد.
 * same-origin فقط برای سازگاری با تنظیم قدیمی مانده و دیگر پروکسی نمی‌سازد.
 */
export type StorageImageMode = 'same-origin' | 'direct';

/** @deprecated */
export type LiaraImageMode = StorageImageMode;

export function getStorageImageMode(): StorageImageMode {
  return 'direct';
}

/** @deprecated */
export const getLiaraImageMode = getStorageImageMode;

export type ToStorageImageSrcOptions = {
  /** بی‌اثر — تصویر استوریج دیگر از پروکسی اپ رد نمی‌شود. */
  forceProxy?: boolean;
  /** بی‌اثر — خروجی همیشه URL عمومی است. */
  preferDirect?: boolean;
};

/** @deprecated */
export type ToLiaraImageSrcOptions = ToStorageImageSrcOptions;

/** آدرس نهایی <img> — URL عمومی استوریج، بدون /api/liara-image */
export function toStorageImageSrc(
  rawUrl: string | null | undefined,
  _options?: ToStorageImageSrcOptions
): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return '';
  const url = unwrapStoredImageProxy(rawUrl);
  if (!url || (!url.startsWith('/') && !isValidHttpImageUrl(url))) return '';
  if (url.startsWith('/api/liara-image') || url.startsWith('/api/storage-image')) return '';
  if (url.startsWith('/')) return url;
  if (!isOurStorageUrl(url)) return url;
  return url;
}

/** @deprecated */
export const toLiaraImageSrc = toStorageImageSrc;

/** پیش‌نمایش ادمین — همان لینک عمومی استوریج */
export function toAdminStorageImageSrc(rawUrl: string | null | undefined): string {
  return toStorageImageSrc(rawUrl);
}
