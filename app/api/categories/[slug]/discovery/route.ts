import { NextResponse } from 'next/server';
import { resolveCategoryBySlug } from '@/lib/category-resolve';
import {
  browseCategoryDiscoveryTopic,
  getCategoryDiscoveryChips,
} from '@/lib/category-discovery/from-db';
import { supportsCategoryDiscovery } from '@/lib/category-discovery/supports';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

export async function GET(
  request: Request,
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

    if (!supportsCategoryDiscovery(category.slug)) {
      return NextResponse.json(
        { error: 'موضوعات کشف برای این دسته فعال نیست' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const topic = (searchParams.get('topic') ?? '').trim();

    if (!topic) {
      const chips = await dbQuery(() =>
        getCategoryDiscoveryChips(prisma, category.id)
      );
      const res = NextResponse.json({ data: { topics: chips } });
      res.headers.set(
        'Cache-Control',
        'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
      );
      return res;
    }

    const result = await dbQuery(() =>
      browseCategoryDiscoveryTopic(prisma, category.id, category.slug, topic)
    );
    if (!result) {
      return NextResponse.json({ error: 'موضوع یافت نشد' }, { status: 404 });
    }

    const res = NextResponse.json({ data: result });
    res.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=180, stale-while-revalidate=300'
    );
    return res;
  } catch (err) {
    console.error('Category discovery error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت موضوعات کشف' },
      { status: 500 }
    );
  }
}
