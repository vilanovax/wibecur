import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { resolveOmdbApiKey, resolveTmdbApiKey } from '@/lib/movie-api-keys';
import {
  buildMoviePosterSearchQueries,
  searchImdbPosters,
  searchTmdbPosters,
  type MoviePosterSearchSource,
} from '@/lib/movie-poster-search';
import { extractEnglishMovieTitle } from '@/lib/item-image-search-query';

/** POST /api/admin/items/search-movie-posters — جستجوی poster از IMDb (OMDb) یا TMDb */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const source = body.source as MoviePosterSearchSource;
    const metadata =
      body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : null;
    const year = body.year ?? metadata?.year;

    if (!title) {
      return NextResponse.json({ error: 'عنوان الزامی است' }, { status: 400 });
    }

    if (source !== 'imdb' && source !== 'tmdb') {
      return NextResponse.json({ error: 'منبع نامعتبر است' }, { status: 400 });
    }

    const searchTitle = extractEnglishMovieTitle(title, metadata) || title;
    const searchOptions = { year, metadata, limit: 12 };
    const queriesTried = buildMoviePosterSearchQueries(searchTitle, metadata);

    if (source === 'imdb') {
      const omdbApiKey = await resolveOmdbApiKey();
      if (!omdbApiKey) {
        return NextResponse.json(
          {
            error:
              'کلید OMDb (IMDb) یافت نشد. در تنظیمات یا OMDB_API_KEY در .env وارد کنید.',
          },
          { status: 400 }
        );
      }

      const results = await searchImdbPosters(searchTitle, omdbApiKey, searchOptions);
      return NextResponse.json({
        results,
        queriesTried,
        message:
          results.length === 0
            ? 'هیچ poster در IMDb یافت نشد — عنوان انگلیسی فیلم را امتحان کنید'
            : undefined,
      });
    }

    const tmdbApiKey = await resolveTmdbApiKey();
    if (!tmdbApiKey) {
      return NextResponse.json(
        {
          error:
            'کلید TMDb یافت نشد. در تنظیمات یا TMDB_API_KEY در .env وارد کنید.',
        },
        { status: 400 }
      );
    }

    const results = await searchTmdbPosters(searchTitle, tmdbApiKey, searchOptions);
    return NextResponse.json({
      results,
      queriesTried,
      message:
        results.length === 0
          ? 'هیچ poster در TMDb یافت نشد — عنوان انگلیسی فیلم را امتحان کنید'
          : undefined,
    });
  } catch (error: unknown) {
    console.error('search-movie-posters error:', error);
    const msg = (error as Error).message || 'خطا در جستجوی poster';
    if (msg.includes('401') || msg.toLowerCase().includes('invalid api key')) {
      return NextResponse.json({ error: 'کلید API نامعتبر است — تنظیمات را بررسی کنید' }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
