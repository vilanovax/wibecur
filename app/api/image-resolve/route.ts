import { NextRequest, NextResponse } from 'next/server';
import { ensureImageInLiara, type ImageFolder } from '@/lib/object-storage';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { isPublicHttpUrl } from '@/lib/ssrf-guard';
import { getClientIp } from '@/lib/client-ip';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { createBoundedCache } from '@/lib/bounded-cache';

const VALID_FOLDERS: ImageFolder[] = ['items', 'avatars', 'covers', 'lists'];

/** کش در حافظه: URL خارجی → URL نهایی. سقف ثابت تا پروسه با پوسترهای تازه بزرگ نشود. */
const RESOLVE_CACHE_MAX = 1_000;
const resolveCache = createBoundedCache<string, string>(RESOLVE_CACHE_MAX);

/**
 * GET /api/image-resolve?url=...&folder=covers
 *
 * اگر URL از لیارا باشد، مستقیم به همان آدرس redirect می‌شود.
 * اگر URL خارجی باشد، یک‌بار به Liara آپلود می‌شود و به آدرس لیارا redirect می‌شود (کش می‌شود).
 */
export async function GET(request: NextRequest) {
  let url = request.nextUrl.searchParams.get('url');
  const folderParam = request.nextUrl.searchParams.get('folder') || 'covers';
  const folder = VALID_FOLDERS.includes(folderParam as ImageFolder)
    ? (folderParam as ImageFolder)
    : 'covers';

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }
  try {
    url = decodeURIComponent(url.trim());
  } catch {
    url = url.trim();
  }

  // محافظ SSRF — فقط http(s) عمومی؛ آدرس‌های داخلی/خصوصی رد می‌شوند.
  if (!isPublicHttpUrl(url)) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (isOurStorageUrl(url)) {
    return NextResponse.redirect(url, 302);
  }

  // Rate limit اختصاصی برای fetch خارجی (endpoint بدون احراز هویت و گران).
  const { success } = await checkActionRateLimit(
    `image-resolve:${getClientIp(request.headers)}`,
    30,
    '1 m'
  );
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const cached = resolveCache.get(url);
  if (cached) {
    return NextResponse.redirect(cached, 302);
  }

  try {
    const resolved = await ensureImageInLiara(url, folder);
    if (resolved) {
      resolveCache.set(url, resolved);
      return NextResponse.redirect(resolved, 302);
    }
  } catch (e) {
    console.error('image-resolve error:', e);
  }

  return NextResponse.json({ error: 'Failed to resolve image' }, { status: 502 });
}
