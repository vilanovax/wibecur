import { NextRequest, NextResponse } from 'next/server';
import { resolvePlaceholderToLiara } from '@/lib/placeholder-liara';
import { isOurStorageUrl } from '@/lib/object-storage-config';

/**
 * GET /api/placeholder?seed=hero-film-movies&size=cover
 *
 * تصویر placeholder را از Picsum دانلود، در Liara آپلود می‌کند و به URL لیارا redirect می‌کند.
 * همه تصاویر در نهایت در Liara Object Storage ذخیره می‌شوند.
 */
export async function GET(request: NextRequest) {
  const seed = request.nextUrl.searchParams.get('seed') || 'default';
  const size = (request.nextUrl.searchParams.get('size') || 'cover') as 'cover' | 'square';
  if (size !== 'cover' && size !== 'square') {
    return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
  }

  try {
    const url = await resolvePlaceholderToLiara(seed, size);
    if (isOurStorageUrl(url)) {
      return NextResponse.redirect(url, 302);
    }
    return NextResponse.redirect(url, 302);
  } catch (e) {
    console.error('Placeholder resolve error:', e);
    return NextResponse.json({ error: 'Failed to resolve placeholder' }, { status: 500 });
  }
}
