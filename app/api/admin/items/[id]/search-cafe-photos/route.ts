import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { searchItemCafePhotos } from '@/lib/fetch-item-cafe-photo';

/** POST /api/admin/items/[id]/search-cafe-photos — جستجوی تصویر کافه/رستوران در Google */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query : undefined;

    const result = await dbQuery(() => searchItemCafePhotos(id, undefined, query));

    if (result.error && result.results.length === 0) {
      const status =
        result.error === 'آیتم یافت نشد'
          ? 404
          : result.error.includes('Google API')
            ? 503
            : 400;
      return NextResponse.json({ error: result.error, ...result }, { status });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('search-cafe-photos error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در جستجوی تصاویر' },
      { status: 500 }
    );
  }
}
