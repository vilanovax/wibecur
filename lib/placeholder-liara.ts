/**
 * تصاویر placeholder — اول از Object Storage لوکال (MinIO)، در صورت عدم دسترسی fallback به API لوکال
 */
import { uploadImageBuffer } from './object-storage';
import { isOurStorageUrl } from './object-storage-config';

/** عدد صحیح از رشته (برای seed ثابت و متنوع) */
function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

const GRADIENTS = [
  ['#6366F1', '#8B5CF6'],
  ['#EC4899', '#F43F5E'],
  ['#F59E0B', '#EF4444'],
  ['#10B981', '#3B82F6'],
  ['#8B5CF6', '#EC4899'],
  ['#14B8A6', '#6366F1'],
  ['#F97316', '#F59E0B'],
  ['#06B6D4', '#8B5CF6'],
  ['#D946EF', '#6366F1'],
  ['#84CC16', '#10B981'],
];

function generateSvgBuffer(seed: string, size: 'cover' | 'square'): Buffer {
  const idx = hashSeed(seed) % GRADIENTS.length;
  const [c1, c2] = GRADIENTS[idx];
  const [w, h] = size === 'square' ? [400, 400] : [800, 400];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <text x="50%" y="54%" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-size="48" font-family="sans-serif" font-weight="700">W</text>
  </svg>`;
  return Buffer.from(svg, 'utf-8');
}

const cache = new Map<string, string>();

/**
 * تصویر placeholder — آپلود SVG لوکال به MinIO، یا fallback به /api/placeholder
 */
export async function resolvePlaceholderToLiara(
  seed: string,
  size: 'cover' | 'square' = 'cover'
): Promise<string> {
  const cacheKey = `${seed}|${size}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const svgBuffer = generateSvgBuffer(seed, size);
    const url = await uploadImageBuffer(svgBuffer, 'image/svg+xml', 'placeholders');
    if (url && isOurStorageUrl(url)) {
      cache.set(cacheKey, url);
      return url;
    }
  } catch {
    // MinIO not available
  }

  // Fallback: local API (no external dependency)
  return `/api/placeholder?seed=${encodeURIComponent(seed)}&size=${size}`;
}
