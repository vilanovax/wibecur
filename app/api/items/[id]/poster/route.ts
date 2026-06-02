import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { resolveItemDisplayImage, resolveItemImage } from '@/lib/resolve-item-image';

/** GET /api/items/[id]/poster — فقط تصویر ذخیره‌شده در DB (بدون TMDB) */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const getCached = unstable_cache(
      async () => {
        const item = await dbQuery(() =>
          prisma.items.findUnique({
            where: { id },
            select: {
              id: true,
              title: true,
              imageUrl: true,
              metadata: true,
              lists: { select: { categories: { select: { slug: true } } } },
            },
          })
        );

        if (!item) return { posterUrl: null as string | null, source: 'none' as const };

        const categorySlug = item.lists?.categories?.slug ?? null;
        const fromDb = resolveItemImage({
          id: item.id,
          imageUrl: item.imageUrl,
          title: item.title,
          metadata: item.metadata as Record<string, unknown> | null,
          categorySlug,
        });

        if (fromDb) {
          return { posterUrl: fromDb, source: 'db' as const };
        }

        const placeholder = resolveItemDisplayImage({
          id: item.id,
          imageUrl: item.imageUrl,
          title: item.title,
          metadata: item.metadata as Record<string, unknown> | null,
          categorySlug,
        });

        return placeholder
          ? { posterUrl: placeholder, source: 'placeholder' as const }
          : { posterUrl: null, source: 'none' as const };
      },
      [`item-poster-${id}`, 'no-tmdb'],
      { revalidate: 86400, tags: [`item-poster-${id}`] }
    );

    const data = await getCached();
    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return res;
  } catch (error) {
    console.error('Item poster error:', error);
    return NextResponse.json({ success: true, data: { posterUrl: null, source: 'none' } });
  }
}
