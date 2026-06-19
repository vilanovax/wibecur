import { NextRequest, NextResponse } from 'next/server';
import { getObjectByStorageKey } from '@/lib/object-storage';
import {
  buildLegacyLiaraPublicUrl,
  extractStorageObjectKeyFromUrl,
} from '@/lib/storage-image-url';
import { isLegacyLiaraStorageUrl } from '@/lib/object-storage-config';

function contentTypeFromKey(key: string, fallback?: string): string {
  if (fallback) return fallback;
  if (key.includes('.webp')) return 'image/webp';
  if (key.includes('.png')) return 'image/png';
  if (key.includes('.gif')) return 'image/gif';
  return 'image/jpeg';
}

/**
 * سرو تصویر از ParsPack با کلید S3 — برای URLهای قدیمی Liara در DB
 * GET /api/storage-image?key=wibe/avatars/xxx.jpg
 * GET /api/storage-image?url=https://storage.c2.liara.space/wibe/avatars/xxx.jpg
 */
export async function GET(request: NextRequest) {
  const keyParam = request.nextUrl.searchParams.get('key');
  const urlParam = request.nextUrl.searchParams.get('url');

  let key = keyParam?.trim() || '';
  if (!key && urlParam?.trim()) {
    const raw = urlParam.trim();
    if (!isLegacyLiaraStorageUrl(raw)) {
      return NextResponse.json({ error: 'Only legacy storage URLs supported' }, { status: 400 });
    }
    key = extractStorageObjectKeyFromUrl(raw) || '';
  }

  if (!key || !key.startsWith('wibe/')) {
    return NextResponse.json({ error: 'Invalid storage key' }, { status: 400 });
  }

  const legacySourceUrl =
    urlParam?.trim() && isLegacyLiaraStorageUrl(urlParam.trim())
      ? urlParam.trim()
      : buildLegacyLiaraPublicUrl(key);

  const result = await getObjectByStorageKey(key, { legacyUrl: legacySourceUrl });
  if (!result) {
    if (isLegacyLiaraStorageUrl(legacySourceUrl)) {
      return NextResponse.redirect(legacySourceUrl, 307);
    }
    return NextResponse.json(
      {
        error: 'Image not found in ParsPack',
        hint: 'فایل ممکن است migrate نشده باشد — آواتار را دوباره آپلود کنید',
      },
      { status: 404 }
    );
  }

  const headers = new Headers();
  headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  headers.set('Content-Type', contentTypeFromKey(key, result.contentType));

  return new NextResponse(new Uint8Array(result.buffer), { status: 200, headers });
}
