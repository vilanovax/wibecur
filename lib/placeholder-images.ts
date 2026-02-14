/**
 * Placeholder image URLs that don't require external requests.
 * Use instead of Unsplash when connection may be blocked (e.g. ERR_CONNECTION_RESET).
 */
const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23e5e7eb'/%3E%3Cstop offset='100%25' style='stop-color:%23d1d5db'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='400' fill='url(%23g)'/%3E%3C/svg%3E";

export const PLACEHOLDER_COVER = PLACEHOLDER_SVG;
export const PLACEHOLDER_COVER_SMALL = PLACEHOLDER_SVG;

/** عدد صحیح از رشته (برای seed ثابت و متنوع) */
function hashSeed(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return String(Math.abs(h) || 1);
}

/**
 * URL تصویر رندوم (Picsum) با seed ثابت — هر کارت یک تصویر متفاوت ولی همیشه همان.
 * در صورت مسدود بودن Picsum، از fallback خاکستری استفاده کن.
 */
export function getRandomPlaceholderUrl(
  seed: string,
  size: 'cover' | 'square' = 'cover'
): string {
  const s = hashSeed(seed || 'default');
  const [w, h] = size === 'square' ? [400, 400] : [400, 200];
  return `https://picsum.photos/seed/${s}/${w}/${h}`;
}
