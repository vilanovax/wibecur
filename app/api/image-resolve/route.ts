import { NextRequest, NextResponse } from 'next/server';
import { ensureImageInLiara, type ImageFolder } from '@/lib/object-storage';
import { isOurStorageUrl } from '@/lib/object-storage-config';

const VALID_FOLDERS: ImageFolder[] = ['items', 'avatars', 'covers', 'lists'];

/** کش در حافظه: URL خارجی → URL نهایی (لیارا یا همان در صورت خطا) */
const resolveCache = new Map<string, string>();

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

  if (!url.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (isOurStorageUrl(url)) {
    return NextResponse.redirect(url, 302);
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
