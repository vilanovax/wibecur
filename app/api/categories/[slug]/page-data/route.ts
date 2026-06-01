import { NextResponse } from 'next/server';
import { resolveCategoryBySlug } from '@/lib/category-resolve';
import { getCachedCategoryPageData } from '@/lib/category-page-cached';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'دسته نامعتبر است' }, { status: 400 });
    }

    const category = await resolveCategoryBySlug(slug);
    if (!category) {
      return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 });
    }

    const data = await getCachedCategoryPageData(category.id);

    const res = NextResponse.json({ data });
    res.headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=300');
    return res;
  } catch (err) {
    console.error('Category page data error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت داده‌های دسته' },
      { status: 500 }
    );
  }
}
