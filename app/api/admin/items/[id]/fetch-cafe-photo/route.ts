import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { fetchItemCafePhoto } from '@/lib/fetch-item-cafe-photo';

/** POST /api/admin/items/[id]/fetch-cafe-photo — آپلود تصویر انتخاب‌شده به ParsPack */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';

    if (!imageUrl) {
      return NextResponse.json({ error: 'آدرس تصویر الزامی است' }, { status: 400 });
    }

    const result = await dbQuery(() => fetchItemCafePhoto(id, imageUrl));

    if (result.status === 'failed') {
      const status =
        result.error === 'آیتم یافت نشد'
          ? 404
          : result.errorCode === 'storage_not_configured'
            ? 503
            : result.errorCode === 'invalid_url'
              ? 400
              : 500;
      return NextResponse.json(
        { error: result.error || 'خطا در ذخیره تصویر', ...result },
        { status }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('fetch-cafe-photo error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در ذخیره تصویر' },
      { status: 500 }
    );
  }
}
