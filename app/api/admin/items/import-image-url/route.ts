import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { importExternalImageToStorage } from '@/lib/admin/import-external-image-to-storage';
import type { ImageFolder } from '@/lib/object-storage';
import { resolveUploadTarget } from '@/lib/upload-profiles';

const VALID_FOLDERS: ImageFolder[] = ['items', 'avatars', 'covers', 'lists', 'hubs', 'site'];

// POST /api/admin/items/import-image-url
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : '';
    const folderParam = typeof body.folder === 'string' ? body.folder : 'items';
    const uploadTarget = purpose
      ? resolveUploadTarget(purpose)
      : {
          folder: VALID_FOLDERS.includes(folderParam as ImageFolder)
            ? (folderParam as ImageFolder)
            : 'items',
          profile: undefined as undefined,
        };
    const folder = uploadTarget.folder as ImageFolder;
    const profile = uploadTarget.profile;
    const metadata =
      body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {};

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL تصویر الزامی است' }, { status: 400 });
    }

    const result = await importExternalImageToStorage(
      imageUrl,
      folder,
      metadata,
      undefined,
      profile
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: result.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در آپلود تصویر';
    console.error('import-image-url error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
