import { NextResponse } from 'next/server';
import { getCachedSimilarItems } from '@/lib/item-similar';

// GET /api/items/[id]/similar — آیتم‌های مشابه (همان دسته، مرتب‌سازی با تگ و امتیاز)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: currentItemId } = await params;
    const data = await getCachedSimilarItems(currentItemId);

    if (data === null) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Similar items error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت آیتم‌های مشابه' },
      { status: 500 }
    );
  }
}
