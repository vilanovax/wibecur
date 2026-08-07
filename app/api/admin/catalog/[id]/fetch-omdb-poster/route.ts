import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { fetchCatalogOmdbPoster } from '@/lib/fetch-catalog-omdb-poster';

/** POST /api/admin/catalog/[id]/fetch-omdb-poster — دریافت پوستر از OMDb و آپلود به ParsPack */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const result = await dbQuery(() => fetchCatalogOmdbPoster(id));

    if (result.status === 'failed') {
      const status =
        result.error === 'موجودیت کاتالوگ یافت نشد'
          ? 404
          : result.errorCode === 'storage_not_configured'
            ? 503
            : 500;
      return NextResponse.json(
        { error: result.error || 'خطا در دریافت پوستر', ...result, itemId: id },
        { status }
      );
    }

    if (
      result.status === 'no_imdb' ||
      result.status === 'no_poster' ||
      result.status === 'no_omdb_key'
    ) {
      return NextResponse.json(
        { error: result.error, ...result, itemId: id },
        { status: 400 }
      );
    }

    return NextResponse.json({ ...result, itemId: id });
  } catch (error: unknown) {
    console.error('catalog fetch-omdb-poster error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در دریافت پوستر' },
      { status: 500 }
    );
  }
}
