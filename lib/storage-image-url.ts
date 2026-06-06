import {
  isLegacyLiaraStorageUrl,
  isOurStorageUrl,
  STORAGE_OBJECT_PREFIX,
} from '@/lib/object-storage-config';
import { toStorageImageSrc } from '@/lib/liara-image-url';

/** استخراج کلید S3 از URL قدیمی Liara یا ParsPack */
export function extractStorageObjectKeyFromUrl(url: string): string | null {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url.replace(/^\/+/, '')}`;
    const u = new URL(normalized);
    const parts = decodeURIComponent(u.pathname).replace(/^\/+/, '').split('/').filter(Boolean);
    if (parts.length === 0) return null;

    const wibeIdx = parts.indexOf(STORAGE_OBJECT_PREFIX);
    if (wibeIdx >= 0) {
      return parts.slice(wibeIdx).join('/');
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * URL نمایش تصویر storage — ParsPack از proxy، Liara قدیمی از /api/storage-image
 * هرگز مستقیم به storage.c2.liara.space درخواست نمی‌زند.
 */
export function resolveStorageImageDisplayUrl(raw: string | null | undefined): string {
  if (!raw?.trim()) return '';
  const url = raw.trim();

  if (isOurStorageUrl(url)) {
    return toStorageImageSrc(url, { forceProxy: true });
  }

  if (isLegacyLiaraStorageUrl(url)) {
    const key = extractStorageObjectKeyFromUrl(url);
    if (key) return `/api/storage-image?key=${encodeURIComponent(key)}`;
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) return url;
  return '';
}

export function shouldBlockDirectLegacyLiaraFetch(url: string | null | undefined): boolean {
  return isLegacyLiaraStorageUrl(url || '');
}
