import { NextRequest, NextResponse } from 'next/server';
import { getObjectByPublicUrl } from '@/lib/object-storage';
import { isOurStorageUrl } from '@/lib/object-storage-config';

/**
 * تحویل تصویر فقط از Liara Object Storage (S3 API یا fetch سرور).
 * منبع خارجی (Picsum و …) استفاده نمی‌شود.
 * GET /api/liara-image?url=https://storage..../wibe/covers/xxx.jpg
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

  if (!isOurStorageUrl(url)) {
    return NextResponse.json({ error: 'Only app storage URLs allowed' }, { status: 400 });
  }

  const result = await getObjectByPublicUrl(url);
  if (!result) {
    // سرور (S3/fetch) شکست خورد؛ مرورگر ممکن است مستقیم به CDN دسترسی داشته باشد
    return NextResponse.redirect(url, 307);
  }

  const headers = new Headers();
  headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  const contentType =
    result.contentType ||
    (url.includes('.webp') ? 'image/webp' : url.includes('.png') ? 'image/png' : 'image/jpeg');
  headers.set('Content-Type', contentType);

  return new NextResponse(new Uint8Array(result.buffer), { status: 200, headers });
}
