import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { uploadImageFromUrl } from '@/lib/object-storage';

// POST /api/admin/items/upload-movie-poster
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { posterUrl } = body;

    if (!posterUrl) {
      return NextResponse.json(
        { error: 'URL تصویر الزامی است' },
        { status: 400 }
      );
    }

    // Upload to Liara Object Storage
    const uploadedUrl = await uploadImageFromUrl(posterUrl, 'movies');

    if (!uploadedUrl) {
      return NextResponse.json(
        { error: 'خطا در آپلود تصویر' },
        { status: 500 }
      );
    }

    return NextResponse.json({ uploadedUrl });
  } catch (error: any) {
    console.error('Error uploading poster:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در آپلود تصویر' },
      { status: 500 }
    );
  }
}
