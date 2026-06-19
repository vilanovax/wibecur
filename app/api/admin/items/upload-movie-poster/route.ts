import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { importExternalImageToStorage } from '@/lib/admin/import-external-image-to-storage';

// POST /api/admin/items/upload-movie-poster
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { posterUrl, metadata } = body;

    if (!posterUrl) {
      return NextResponse.json(
        { error: 'URL تصویر الزامی است' },
        { status: 400 }
      );
    }

    const meta =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : {};

    const result = await importExternalImageToStorage(posterUrl, 'items', meta);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ uploadedUrl: result.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در آپلود تصویر';
    console.error('Error uploading poster:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
