/**
 * نمایش تصاویر فقط از Liara Object Storage.
 */
import { toAbsoluteImageUrl } from '@/lib/seo';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { toLiaraImageSrc } from '@/lib/liara-image-url';

/** آدرس نهایی برای <img src> — Liara (مستقیم یا same-origin) */
export function getDisplayImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return '';
  const trimmed = rawUrl.trim();
  const absolute = toAbsoluteImageUrl(trimmed) ?? trimmed;
  if (!isOurStorageUrl(absolute)) return '';
  return toLiaraImageSrc(absolute);
}
