import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getTrendingByCategory } from '@/lib/trending/service';

const CACHE_SECONDS = 600;

function isLikelyCuid(param: string): boolean {
  return param.length >= 20 && param.length <= 30 && /^[a-z0-9]+$/i.test(param);
}

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
      return NextResponse.json(
        { success: false, error: 'دسته یافت نشد' },
        { status: 404 }
      );
    }

    const getCached = unstable_cache(
      () => getTrendingByCategory(prisma, category.id, 10),
      [`trending-category-${category.id}`],
      { revalidate: CACHE_SECONDS, tags: ['trending', `trending-${category.id}`] }
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
