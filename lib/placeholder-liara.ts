/**
 * Placeholder — فقط از Liara (بدون سورس خارجی).
 * در صورت نبود Liara، به SVG محلی redirect می‌شود.
 */
import { uploadImageBuffer } from './object-storage';
import { isOurStorageUrl } from './object-storage-config';
import { buildLocalPlaceholderSvg } from './local-placeholder-svg';

const cache = new Map<string, string>();

/**
 * placeholder را در Liara آپلود می‌کند و URL لیارا برمی‌گرداند.
 * اگر Liara در دسترس نباشد null برمی‌گردد.
 */
export async function resolvePlaceholderToLiara(
  seed: string,
  size: 'cover' | 'square' = 'cover'
): Promise<string | null> {
  const cacheKey = `${seed}|${size}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const svgBuffer = buildLocalPlaceholderSvg(seed, size);
  const liaraUrl = await uploadImageBuffer(svgBuffer, 'image/svg+xml', 'placeholders');
  if (liaraUrl && isOurStorageUrl(liaraUrl)) {
    cache.set(cacheKey, liaraUrl);
    return liaraUrl;
  }
  return null;
}
