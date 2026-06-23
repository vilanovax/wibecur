import { normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';

/**
 * next/image cannot optimize `/api/liara-image?url=...` (/_next/image returns 400).
 * Unwrap proxy URLs to direct storage HTTPS when possible; otherwise serve proxy unoptimized.
 */
export function resolveNextImageSrc(src: string): {
  src: string;
  unoptimized: boolean;
} {
  const trimmed = src.trim();
  if (!trimmed) return { src: '', unoptimized: false };

  const unwrapped = normalizeImageUrlForStorage(trimmed);
  const nextSrc =
    unwrapped && /^https?:\/\//.test(unwrapped) ? unwrapped : trimmed;
  const unoptimized = nextSrc.startsWith('/') && nextSrc.includes('?');
  return { src: nextSrc, unoptimized };
}
