/**
 * برای نمایش تصاویر فقط از Liara Object Storage.
 * اگر URL خارجی باشد، از API resolve استفاده می‌شود تا تصویر یک‌بار به Liara آپلود و بعد از همانجا لود شود.
 */
import { toAbsoluteImageUrl } from '@/lib/seo';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import type { ImageFolder } from '@/lib/object-storage';

/**
 * آدرس نهایی برای استفاده در <img src> یا ImageWithFallback.
 * - اگر خالی باشد: '' برمی‌گرداند.
 * - اگر قبلاً Liara باشد: همان URL (برای استفاده با پراکسی در صورت نیاز).
 * - اگر خارجی باشد: آدرس API resolve تا سرور تصویر را به Liara منتقل و redirect به Liara بدهد.
 */
export function getDisplayImageUrl(
  rawUrl: string | null | undefined,
  folder: ImageFolder = 'covers'
): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return '';
  const trimmed = rawUrl.trim();
  const absolute = toAbsoluteImageUrl(trimmed) ?? trimmed;
  if (isOurStorageUrl(absolute)) return absolute;
  return `/api/image-resolve?url=${encodeURIComponent(absolute)}&folder=${encodeURIComponent(folder)}`;
}
