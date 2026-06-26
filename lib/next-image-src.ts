import { normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';
import { isLegacyLiaraStorageUrl, isParsPackStorageUrl } from '@/lib/object-storage-config';
import { resolveStorageImageDisplayUrl } from '@/lib/storage-image-url';

function isProxiedStoragePath(url: string): boolean {
  return url.startsWith('/api/liara-image') || url.startsWith('/api/storage-image');
}

/**
 * next/image cannot optimize `/api/liara-image?url=...` or `/api/storage-image?...`.
 * ParsPack and legacy Liara direct URLs must use same-origin proxy + unoptimized.
 */
export function resolveNextImageSrc(src: string): {
  src: string;
  unoptimized: boolean;
} {
  const trimmed = src.trim();
  if (!trimmed) return { src: '', unoptimized: false };

  if (isProxiedStoragePath(trimmed)) {
    return { src: trimmed, unoptimized: true };
  }

  const normalized = normalizeImageUrlForStorage(trimmed);
  const httpsUrl =
    normalized && /^https?:\/\//.test(normalized) ? normalized : null;

  if (httpsUrl && (isParsPackStorageUrl(httpsUrl) || isLegacyLiaraStorageUrl(httpsUrl))) {
    return {
      src: resolveStorageImageDisplayUrl(httpsUrl),
      unoptimized: true,
    };
  }

  const nextSrc = httpsUrl ?? trimmed;
  const unoptimized = nextSrc.startsWith('/') && nextSrc.includes('?');
  return { src: nextSrc, unoptimized };
}
