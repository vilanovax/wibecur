import { isOurStorageUrl, isParsPackStorageUrl } from '@/lib/object-storage-config';
import { isValidHttpImageUrl, normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';

/**
 * نحوهٔ تحویل تصویر Object Storage به مرورگر:
 * - same-origin: از API خود اپ (سرور با S3 می‌خواند) — برای ParsPack توصیه می‌شود
 * - direct: URL عمومی parspack.net (فقط اگر از شبکه کاربر در دسترس باشد)
 */
export type StorageImageMode = 'same-origin' | 'direct';

/** @deprecated */
export type LiaraImageMode = StorageImageMode;

export function getStorageImageMode(): StorageImageMode {
  const mode = process.env.NEXT_PUBLIC_LIARA_IMAGE_MODE?.trim();
  if (mode === 'direct') return 'direct';
  // ParsPack از مرورگر مستقیم اغلب timeout می‌دهد — پیش‌فرض proxy
  return 'same-origin';
}

/** @deprecated */
export const getLiaraImageMode = getStorageImageMode;

export type ToStorageImageSrcOptions = {
  /** حتی در حالت direct، از API same-origin استفاده کن */
  forceProxy?: boolean;
};

/** @deprecated */
export type ToLiaraImageSrcOptions = ToStorageImageSrcOptions;

/** آدرس نهایی <img> — برای URLهای ParsPack / استوریج داخلی */
export function toStorageImageSrc(
  rawUrl: string | null | undefined,
  options?: ToStorageImageSrcOptions
): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return '';
  const url = normalizeImageUrlForStorage(rawUrl);
  if (!url || (!url.startsWith('/') && !isValidHttpImageUrl(url))) return '';
  if (url.startsWith('/')) return url;
  if (!isOurStorageUrl(url)) return url;

  const useProxy =
    options?.forceProxy ||
    getStorageImageMode() === 'same-origin' ||
    isParsPackStorageUrl(url);

  if (!useProxy) return url;

  return `/api/liara-image?url=${encodeURIComponent(url)}`;
}

/** @deprecated */
export const toLiaraImageSrc = toStorageImageSrc;

/** thumbnail ادمین — همیشه از proxy برای ParsPack */
export function toAdminStorageImageSrc(rawUrl: string | null | undefined): string {
  return toStorageImageSrc(rawUrl, { forceProxy: true });
}
