import { unwrapStoredImageProxy } from '@/lib/image-url-sanitize';
import {
  isLegacyLiaraStorageUrl,
  isOurStorageUrl,
  STORAGE_OBJECT_PREFIX,
} from '@/lib/object-storage-config';

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

/** URL عمومی Liara قدیمی برای یک کلید wibe/… */
export function buildLegacyLiaraPublicUrl(objectKey: string): string {
  const key = objectKey.replace(/^\/+/, '');
  return `https://storage.c2.liara.space/${key}`;
}

/**
 * URL نمایش تصویر storage — همیشه لینک مستقیم.
 * پروکسی /api/liara-image و /api/storage-image ساخته نمی‌شود.
 */
export function resolveStorageImageDisplayUrl(raw: string | null | undefined): string {
  if (!raw?.trim()) return '';
  const url = unwrapStoredImageProxy(raw.trim()) || raw.trim();

  if (isOurStorageUrl(url) || isLegacyLiaraStorageUrl(url)) {
    return url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/api/liara-image') || url.startsWith('/api/storage-image')) return '';
  if (url.startsWith('/')) return url;
  return '';
}

export function shouldBlockDirectLegacyLiaraFetch(url: string | null | undefined): boolean {
  return isLegacyLiaraStorageUrl(url || '');
}
