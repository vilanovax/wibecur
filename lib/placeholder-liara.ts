/**
 * تصاویر placeholder را از سورس خارجی (Picsum) می‌گیرد، در Liara آپلود می‌کند و URL نهایی را برمی‌گرداند.
 * همه تصاویر در نهایت در Liara Object Storage ذخیره می‌شوند.
 */
import { uploadImageFromUrl } from './object-storage';
import { isOurStorageUrl } from './object-storage-config';

/** عدد صحیح از رشته (برای seed ثابت و متنوع) */
function hashSeed(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return String(Math.abs(h) || 1);
}

function getPicsumUrl(seed: string, size: 'cover' | 'square'): string {
  const s = hashSeed(seed || 'default');
  const [w, h] = size === 'square' ? [400, 400] : [400, 200];
  return `https://picsum.photos/seed/${s}/${w}/${h}`;
}

const cache = new Map<string, string>();

/**
 * تصویر placeholder را resolve می‌کند.
 * اگر در cache باشد یا قبلاً آپلود شده، URL لیارا برمی‌گرداند.
 * وگرنه از Picsum دانلود، در Liara آپلود و cache می‌کند.
 * در صورت نبود Liara، مستقیم URL Picsum برمی‌گرداند.
 */
export async function resolvePlaceholderToLiara(
  seed: string,
  size: 'cover' | 'square' = 'cover'
): Promise<string> {
  const cacheKey = `${seed}|${size}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const picsumUrl = getPicsumUrl(seed, size);
  const liaraUrl = await uploadImageFromUrl(picsumUrl, 'placeholders');
  if (liaraUrl && isOurStorageUrl(liaraUrl)) {
    cache.set(cacheKey, liaraUrl);
    return liaraUrl;
  }
  return picsumUrl;
}
