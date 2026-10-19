import { normalizeLocalBannerSrc } from '@/lib/image-url-policy';
import { unwrapStoredImageProxy } from '@/lib/image-url-sanitize';
import { isLegacyLiaraStorageUrl, isParsPackStorageUrl } from '@/lib/object-storage-config';

/**
 * next/image must not re-host storage files.
 * ParsPack and legacy Liara URLs stay as the public object URL (unoptimized).
 */
export function resolveNextImageSrc(src: string): {
  src: string;
  unoptimized: boolean;
} {
  const trimmed = normalizeLocalBannerSrc(src);
  if (!trimmed) return { src: '', unoptimized: false };

  const normalized = unwrapStoredImageProxy(trimmed);
  const httpsUrl =
    normalized && /^https?:\/\//.test(normalized) ? normalized : null;

  if (httpsUrl && (isParsPackStorageUrl(httpsUrl) || isLegacyLiaraStorageUrl(httpsUrl))) {
    return { src: httpsUrl, unoptimized: true };
  }

  const nextSrc = httpsUrl ?? trimmed;
  if (nextSrc.startsWith('/api/liara-image') || nextSrc.startsWith('/api/storage-image')) {
    return { src: '', unoptimized: true };
  }
  const unoptimized = nextSrc.startsWith('/') && nextSrc.includes('?');
  return { src: nextSrc, unoptimized };
}
