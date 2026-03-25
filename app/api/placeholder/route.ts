import { NextRequest, NextResponse } from 'next/server';
import { resolvePlaceholderToLiara } from '@/lib/placeholder-liara';
import { isOurStorageUrl } from '@/lib/object-storage-config';

/**
 * پالت رنگی گرادیان — seed مشخص می‌کنه کدوم رنگ انتخاب بشه (ثابت برای هر کارت)
 */
const GRADIENTS = [
  ['#6366F1', '#8B5CF6'], // indigo → violet
  ['#EC4899', '#F43F5E'], // pink → rose
  ['#F59E0B', '#EF4444'], // amber → red
  ['#10B981', '#3B82F6'], // emerald → blue
  ['#8B5CF6', '#EC4899'], // violet → pink
  ['#14B8A6', '#6366F1'], // teal → indigo
  ['#F97316', '#F59E0B'], // orange → amber
  ['#06B6D4', '#8B5CF6'], // cyan → violet
  ['#D946EF', '#6366F1'], // fuchsia → indigo
  ['#84CC16', '#10B981'], // lime → emerald
];

function hashToIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % GRADIENTS.length;
}

function generatePlaceholderSvg(seed: string, size: 'cover' | 'square'): string {
  const idx = hashToIndex(seed);
  const [c1, c2] = GRADIENTS[idx];
  const [w, h] = size === 'square' ? [400, 400] : [800, 400];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <text x="50%" y="54%" text-anchor="middle" fill="rgba(255,255,255,0.25)" font-size="48" font-family="sans-serif" font-weight="700">W</text>
</svg>`;
}

/**
 * GET /api/placeholder?seed=hero-film-movies&size=cover
 *
 * 1. سعی می‌کنه از Liara/MinIO تصویر آپلود شده برگردونه
 * 2. اگه نشد → SVG گرادیان لوکال (بدون نیاز به اینترنت)
 */
export async function GET(request: NextRequest) {
  const seed = request.nextUrl.searchParams.get('seed') || 'default';
  const size = (request.nextUrl.searchParams.get('size') || 'cover') as 'cover' | 'square';
  if (size !== 'cover' && size !== 'square') {
    return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
  }

  // Try Liara/MinIO first
  try {
    const url = await resolvePlaceholderToLiara(seed, size);
    if (isOurStorageUrl(url)) {
      return NextResponse.redirect(url, 302);
    }
  } catch {
    // Fall through to local SVG
  }

  // Fallback: local gradient SVG (no external dependency)
  const svg = generatePlaceholderSvg(seed, size);
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
