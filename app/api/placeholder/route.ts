import { NextRequest, NextResponse } from 'next/server';
import { resolvePlaceholderToLiara } from '@/lib/placeholder-liara';
import { getLocalPlaceholderUrl } from '@/lib/placeholder-images';
import { isOurStorageUrl } from '@/lib/object-storage-config';

/**
 * GET /api/placeholder?seed=hero-film-movies&size=cover
 * تلاش برای آپلود SVG placeholder در Liara؛ در غیر این صورت SVG محلی.
 */
export async function GET(request: NextRequest) {
  const seed = request.nextUrl.searchParams.get('seed') || 'default';
  const size = (request.nextUrl.searchParams.get('size') || 'cover') as 'cover' | 'square';
  if (size !== 'cover' && size !== 'square') {
    return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
  }

  try {
    const url = await resolvePlaceholderToLiara(seed, size);
    if (url && isOurStorageUrl(url)) {
      return NextResponse.redirect(url, 302);
    }
  } catch (e) {
    console.error('Placeholder resolve error:', e);
  }

  const local = getLocalPlaceholderUrl(size);
  return NextResponse.redirect(new URL(local, request.url), 302);
}
