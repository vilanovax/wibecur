import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { applyCatalogRepairPhoto, migrateCatalogRepairExternal } from '@/lib/fetch-catalog-repair-photo';

/** POST /api/admin/catalog/[id]/apply-repair-photo — body: { imageUrl } | { migrateExternal: true } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.migrateExternal === true) {
      const useCastandoProxy = body.useCastandoProxy === true;
      const result = await dbQuery(() => migrateCatalogRepairExternal(id, undefined, { useCastandoProxy }));
      if (result.status === 'failed') {
        const status =
          result.error === 'موجودیت کاتالوگ یافت نشد'
            ? 404
            : result.errorCode === 'storage_not_configured'
              ? 503
              : 500;
        return NextResponse.json({ error: result.error, ...result }, { status });
      }
      return NextResponse.json(result);
    }

    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    if (!imageUrl) {
      return NextResponse.json({ error: 'آدرس تصویر الزامی است' }, { status: 400 });
    }

    const useCastandoProxy = body.useCastandoProxy === true;
    const result = await dbQuery(() => applyCatalogRepairPhoto(id, imageUrl, undefined, { useCastandoProxy }));

    if (result.status === 'failed') {
      const status =
        result.error === 'موجودیت کاتالوگ یافت نشد'
          ? 404
          : result.errorCode === 'storage_not_configured'
            ? 503
            : result.errorCode === 'invalid_url'
              ? 400
              : 500;
      return NextResponse.json({ error: result.error || 'خطا در ذخیره تصویر', ...result }, { status });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('apply-repair-photo error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در ذخیره تصویر' },
      { status: 500 }
    );
  }
}
