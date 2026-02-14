import { NextRequest, NextResponse } from 'next/server';
import { getObjectByPublicUrl } from '@/lib/object-storage';

/**
 * پراکسی تصاویر Liara وقتی بارگذاری مستقیم در مرورگر خطا می‌دهد (مثلاً باکت خصوصی یا CORS).
 * GET /api/image-proxy?url=https://storage..../bucket/key
 */
export async function GET(request: NextRequest) {
  let url = request.nextUrl.searchParams.get('url');
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }
  try {
    url = decodeURIComponent(url.trim());
  } catch {
    url = url.trim();
  }

  const result = await getObjectByPublicUrl(url);
  if (!result) {
    return NextResponse.json({ error: 'Forbidden or not found' }, { status: 404 });
  }

  const headers = new Headers();
  headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  const contentType = result.contentType || (url.includes('.webp') ? 'image/webp' : url.includes('.png') ? 'image/png' : 'image/jpeg');
  headers.set('Content-Type', contentType);

  return new NextResponse(new Uint8Array(result.buffer), { status: 200, headers });
}
