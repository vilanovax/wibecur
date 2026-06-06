import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { migrateCatalogExternalImageToLiara } from '@/lib/migrate-catalog-image-to-liara';

/** POST /api/admin/catalog/[id]/migrate-image */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const result = await dbQuery(() => migrateCatalogExternalImageToLiara(id));

    if (result.status === 'failed') {
      const isConnectionError =
        result.errorCode === 'upload_failed' &&
        typeof result.error === 'string' &&
        (result.error.includes('ParsPack') ||
          result.error.includes('ECONNREFUSED') ||
          result.error.includes('ETIMEDOUT') ||
          result.error.includes('شبکه'));
      const status =
        result.error === 'موجودیت کاتالوگ یافت نشد'
          ? 404
          : result.errorCode === 'storage_not_configured'
            ? 503
            : isConnectionError
              ? 502
              : 500;
      return NextResponse.json(
        { error: result.error || 'خطا در مهاجرت تصویر', ...result, itemId: id },
        { status }
      );
    }

    if (result.status === 'no_image') {
      return NextResponse.json(
        { error: result.error || 'تصویری یافت نشد', ...result, itemId: id },
        { status: 400 }
      );
    }

    return NextResponse.json({ ...result, itemId: id });
  } catch (error: unknown) {
    console.error('catalog migrate-image error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در مهاجرت تصویر' },
      { status: 500 }
    );
  }
}
