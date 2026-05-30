import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getDecryptedSettings } from '@/lib/settings';
import { fetchTmdbPosterUrl, extractPosterSearchTitles } from '@/lib/tmdb-poster';
import { isMovieLikeCategory, resolveItemImage } from '@/lib/resolve-item-image';

/** GET /api/items/[id]/poster — poster از DB یا TMDB */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const forceEnrich = new URL(request.url).searchParams.get('enrich') === '1';

    const getCached = unstable_cache(
      async (enrich: boolean) => {
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
          imageUrl: item.imageUrl,
          title: item.title,
          metadata: item.metadata as Record<string, unknown> | null,
          categorySlug,
        });

        if (fromDb && !enrich) {
          return { posterUrl: fromDb, source: 'db' as const };
        }

        if (!isMovieLikeCategory(categorySlug)) {
          return fromDb
            ? { posterUrl: fromDb, source: 'db' as const }
            : { posterUrl: null, source: 'none' as const };
        }

        const settings = await getDecryptedSettings();
        if (!settings.tmdbApiKey) {
          return fromDb && !enrich
            ? { posterUrl: fromDb, source: 'db' as const }
            : { posterUrl: null, source: 'none' as const };
        }

        const tmdbPoster = await fetchTmdbPosterUrl(settings.tmdbApiKey, {
          title: item.title,
          year: (item.metadata as Record<string, unknown> | null)?.year as
            | string
            | number
            | undefined,
          alternativeTitles: extractPosterSearchTitles(
            item.title,
            item.metadata as Record<string, unknown> | null
          ),
        });
        if (tmdbPoster) {
          void dbQuery(() =>
            prisma.items.update({
              where: { id: item.id },
              data: { imageUrl: tmdbPoster },
            })
          ).catch((err) => console.warn('Failed to persist item poster:', err));

          return { posterUrl: tmdbPoster, source: 'tmdb' as const };
        }

        return fromDb && !enrich
          ? { posterUrl: fromDb, source: 'db' as const }
          : { posterUrl: null, source: 'none' as const };
      },
      [`item-poster-${id}`, forceEnrich ? 'enrich' : 'default'],
      { revalidate: 86400, tags: [`item-poster-${id}`] }
    );

    const data = await getCached(forceEnrich);
    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return res;
  } catch (error) {
    console.error('Item poster error:', error);
    return NextResponse.json({ success: true, data: { posterUrl: null, source: 'none' } });
  }
}
