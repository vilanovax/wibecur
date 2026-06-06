import { isOurStorageUrl } from '@/lib/object-storage-config';
import {
  isValidHttpImageUrl,
  normalizeImageUrlForStorage,
} from '@/lib/image-url-sanitize';

export const CASTANDO_IMAGE_PROXY_PREFIX =
  'https://castando.ir/wibe/image-proxy.php?url=';

export function isCastandoImageProxyUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const lower = url.trim().toLowerCase();
  return lower.includes('castando.ir') && lower.includes('image-proxy.php?url=');
}

/** URL داخلی تصویر — بدون لایه castando */
export function unwrapCastandoImageProxyUrl(url: string | null | undefined): string {
  const normalized = normalizeImageUrlForStorage(url);
  if (!normalized) return '';

  if (isCastandoImageProxyUrl(normalized)) {
    const idx = normalized.indexOf('?url=');
    if (idx >= 0) {
      const inner = normalized.slice(idx + 5);
      try {
        return decodeURIComponent(inner).trim();
      } catch {
        return inner.trim();
      }
    }
  }

  return normalized;
}

/** کاور/بنر لیست یا دسته — نه poster آیتم */
export function isBannerStorageImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const lower = url.trim().toLowerCase();
  if (lower.includes('/covers/') || lower.includes('/hubs/')) return true;
  if (lower.includes('/lists/') && !lower.includes('/items/')) return true;
  if (lower.includes('horizontalimage') || lower.includes('banner')) return true;
  return false;
}

/** هر URL که parspack در آن باشد — نیاز به wrap ندارد */
export function containsParsPackStorage(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return url.trim().toLowerCase().includes('parspack');
}

export function needsCastandoProxyWrap(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  if (isCastandoImageProxyUrl(url)) return false;

  const inner = unwrapCastandoImageProxyUrl(url);
  if (!inner || !isValidHttpImageUrl(inner)) return false;
  if (containsParsPackStorage(inner)) return false;
  if (isOurStorageUrl(inner)) return false;
  if (isBannerStorageImageUrl(inner)) return false;
  return true;
}

/** castando proxy — بدون encode: prefix + URL اصلی */
export function buildCastandoProxyImageUrl(originalUrl: string): string {
  const inner = unwrapCastandoImageProxyUrl(originalUrl).trim();
  return `${CASTANDO_IMAGE_PROXY_PREFIX}${inner}`;
}

/** castando proxy — بدون encode روی URL داخلی (مطابق castando) */
export function wrapWithCastandoImageProxy(url: string | null | undefined): string | null {
  if (!needsCastandoProxyWrap(url)) {
    if (isCastandoImageProxyUrl(url)) return url!.trim();
    return null;
  }
  const inner = unwrapCastandoImageProxyUrl(url);
  return buildCastandoProxyImageUrl(inner);
}
