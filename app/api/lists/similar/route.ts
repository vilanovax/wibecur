import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getTopSimilarLists, type ListForSimilarity } from '@/lib/listSimilarity';
import { publicCuratedListWhere } from '@/lib/public-content-filters';

async function getSimilarForSlug(slug: string) {
  const list = await dbQuery(() =>
    prisma.lists.findFirst({
      where: { slug, ...publicCuratedListWhere },
      select: {
        id: true,
        categoryId: true,
        saveCount: true,
        tags: true,
        items: {
          where: { deletedAt: null },
          select: { title: true },
        },
      },
    })
  );

  if (!list) return null;

  const input: ListForSimilarity = {
    id: list.id,
    categoryId: list.categoryId,
    saveCount: list.saveCount ?? 0,
    tags: list.tags ?? [],
    items: list.items.map((i) => ({ title: i.title })),
  };

  const getCached = unstable_cache(
    () => getTopSimilarLists(prisma, input),
    [`list-similar-api-${list.id}`],
    { revalidate: 300, tags: [`list-similar-${list.id}`] }
  );

  return getCached();
}

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get('slug')?.trim();
    if (!slug) {
      return NextResponse.json({ success: false, error: 'لیست نامعتبر است' }, { status: 400 });
    }

    const data = await getSimilarForSlug(slug);
    if (data === null) {
      return NextResponse.json({ success: false, error: 'لیست یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Similar lists error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست‌های مشابه' },
      { status: 500 }
    );
  }
}
