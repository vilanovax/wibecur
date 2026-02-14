import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCategoryPageData } from '@/lib/category-page-data';

function isLikelyCuid(param: string): boolean {
  return param.length >= 20 && param.length <= 30 && /^[a-z0-9]+$/i.test(param);
}

const CACHE_SECONDS = 300; // 5 min

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'دسته نامعتبر است' }, { status: 400 });
    }

    const category = await dbQuery(() =>
      isLikelyCuid(slug)
        ? prisma.categories.findUnique({
            where: { id: slug, isActive: true },
            select: { id: true },
          })
        : prisma.categories.findUnique({
            where: { slug, isActive: true },
            select: { id: true },
          })
    );

    if (!category) {
      return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 });
    }

    const getCached = unstable_cache(
      () => getCategoryPageData(prisma, category.id),
      [`category-page-${category.id}`],
      { revalidate: CACHE_SECONDS, tags: [`category-${category.id}`] }
    );

    const data = await getCached();

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
