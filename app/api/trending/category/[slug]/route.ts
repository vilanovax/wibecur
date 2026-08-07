import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getTrendingByCategory } from '@/lib/trending/service';
import { resolveCategoryId } from '@/lib/category-resolve';

const CACHE_SECONDS = 600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'دسته نامعتبر است' },
        { status: 400 }
      );
    }

    const categoryId = await resolveCategoryId(slug);

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'دسته یافت نشد' },
        { status: 404 }
      );
    }

    const getCached = unstable_cache(
      () => getTrendingByCategory(prisma, categoryId, 10),
      [`trending-category-${categoryId}`],
      { revalidate: CACHE_SECONDS, tags: ['trending', `trending-${categoryId}`] }
    );
    const data = await getCached();

    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return res;
  } catch (err) {
    console.error('Trending category error:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت ترندها' },
      { status: 500 }
    );
  }
}
