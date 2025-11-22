import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// POST /api/admin/items/fetch-from-imdb
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'عنوان الزامی است' },
        { status: 400 }
      );
    }

    if (!process.env.OMDB_API_KEY) {
      return NextResponse.json(
        { error: 'کلید API OMDb تنظیم نشده است' },
        { status: 500 }
      );
    }

    // Search for movie/series by title
    const searchUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${encodeURIComponent(title)}&type=movie`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.Response === 'False') {
      return NextResponse.json(
        { error: 'فیلم/سریالی با این عنوان یافت نشد' },
        { status: 404 }
      );
    }

    // Get first result's full details
    const firstResult = searchData.Search?.[0];
    if (!firstResult) {
      return NextResponse.json(
        { error: 'نتیجه‌ای یافت نشد' },
        { status: 404 }
      );
    }

    const detailsUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${firstResult.imdbID}&plot=full`;
    const detailsResponse = await fetch(detailsUrl);
    const details = await detailsResponse.json();

    if (details.Response === 'False') {
      return NextResponse.json(
        { error: 'خطا در دریافت جزئیات' },
        { status: 500 }
      );
    }

    // Return structured data
    return NextResponse.json({
      title: details.Title,
      year: details.Year ? parseInt(details.Year) : undefined,
      genre: details.Genre?.split(',')[0].trim(), // First genre
      imdbRating: details.imdbRating !== 'N/A' ? details.imdbRating : undefined,
      poster: details.Poster !== 'N/A' ? details.Poster : undefined,
      plot: details.Plot !== 'N/A' ? details.Plot : undefined,
      director: details.Director !== 'N/A' ? details.Director : undefined,
      actors: details.Actors !== 'N/A' ? details.Actors : undefined,
      // Return search results for user selection
      alternatives: searchData.Search?.slice(0, 5).map((item: any) => ({
        imdbID: item.imdbID,
        title: item.Title,
        year: item.Year,
        poster: item.Poster !== 'N/A' ? item.Poster : undefined,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching from OMDb:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}

// GET /api/admin/items/fetch-from-imdb?imdbId=tt1234567
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const imdbId = searchParams.get('imdbId');

    if (!imdbId) {
      return NextResponse.json(
        { error: 'IMDb ID الزامی است' },
        { status: 400 }
      );
    }

    if (!process.env.OMDB_API_KEY) {
      return NextResponse.json(
        { error: 'کلید API OMDb تنظیم نشده است' },
        { status: 500 }
      );
    }

    const url = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${imdbId}&plot=full`;
    const response = await fetch(url);
    const details = await response.json();

    if (details.Response === 'False') {
      return NextResponse.json(
        { error: 'فیلم یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      title: details.Title,
      year: details.Year ? parseInt(details.Year) : undefined,
      genre: details.Genre?.split(',')[0].trim(),
      imdbRating: details.imdbRating !== 'N/A' ? details.imdbRating : undefined,
      poster: details.Poster !== 'N/A' ? details.Poster : undefined,
      plot: details.Plot !== 'N/A' ? details.Plot : undefined,
      director: details.Director !== 'N/A' ? details.Director : undefined,
      actors: details.Actors !== 'N/A' ? details.Actors : undefined,
    });
  } catch (error: any) {
    console.error('Error fetching from OMDb:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
