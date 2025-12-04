import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { getDecryptedSettings } from '@/lib/settings';
import axios from 'axios';

// POST /api/items/fetch-movie-data - جستجوی فیلم از TMDb/OMDb (برای کاربران لاگین شده)
export async function POST(request: NextRequest) {
  try {
    // Check authentication (user must be logged in, but not necessarily admin)
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'برای استفاده از این قابلیت باید وارد حساب کاربری خود شوید' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, returnMultiple = true } = body;

    if (!title) {
      return NextResponse.json({ error: 'عنوان الزامی است' }, { status: 400 });
    }

    const settings = await getDecryptedSettings();

    // If returnMultiple, search and return multiple results
    if (returnMultiple) {
      return await searchMultipleMovies(title, settings);
    }

    return NextResponse.json(
      { error: 'این API فقط از حالت returnMultiple پشتیبانی می‌کند' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching movie data:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت اطلاعات فیلم' },
      { status: 500 }
    );
  }
}

/**
 * Search multiple movies and return array of results
 */
async function searchMultipleMovies(title: string, settings: any) {
  const results: any[] = [];

  // Search TMDb (better for multiple results)
  if (settings.tmdbApiKey) {
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${settings.tmdbApiKey}&query=${encodeURIComponent(title)}&language=en-US&page=1`;
      const response = await axios.get(searchUrl, { timeout: 10000 });

      if (response.data.results && response.data.results.length > 0) {
        // Get top 8 results
        const topResults = response.data.results.slice(0, 8);

        for (const movie of topResults) {
          // Get full details for each movie
          try {
            const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${settings.tmdbApiKey}&language=en-US&append_to_response=credits`;
            const detailsResponse = await axios.get(detailsUrl, {
              timeout: 5000,
            });
            const details = detailsResponse.data;

            // Extract director from credits
            const director = details.credits?.crew?.find(
              (person: any) => person.job === 'Director'
            )?.name || null;

            results.push({
              id: `tmdb-${movie.id}`,
              source: 'tmdb',
              title: details.title,
              originalTitle: details.original_title,
              year: details.release_date
                ? parseInt(details.release_date.split('-')[0])
                : null,
              genre: details.genres?.[0]?.name || null,
              director: director,
              rating: details.vote_average || null,
              plot: details.overview || null,
              posterUrl: details.poster_path
                ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                : null,
              backdropUrl: details.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
                : null,
              popularity: details.popularity || 0,
            });
          } catch (error) {
            console.error(`Error fetching details for movie ${movie.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('TMDb search error:', error);
    }
  }

  // If no results from TMDb, try OMDb search
  if (results.length === 0 && settings.omdbApiKey) {
    try {
      const searchUrl = `https://www.omdbapi.com/?apikey=${settings.omdbApiKey}&s=${encodeURIComponent(title)}&type=movie`;
      const response = await axios.get(searchUrl, { timeout: 10000 });

      if (response.data.Response === 'True' && response.data.Search) {
        const topResults = response.data.Search.slice(0, 8);

        for (const movie of topResults) {
          try {
            // Get full details
            const detailsUrl = `https://www.omdbapi.com/?apikey=${settings.omdbApiKey}&i=${movie.imdbID}&plot=full`;
            const detailsResponse = await axios.get(detailsUrl, {
              timeout: 5000,
            });
            const details = detailsResponse.data;

            results.push({
              id: `omdb-${movie.imdbID}`,
              source: 'omdb',
              imdbID: movie.imdbID,
              title: details.Title,
              year: details.Year ? parseInt(details.Year) : null,
              genre: details.Genre?.split(',')[0].trim() || null,
              director: details.Director !== 'N/A' ? details.Director : null,
              rating: details.imdbRating !== 'N/A' ? details.imdbRating : null,
              plot: details.Plot !== 'N/A' ? details.Plot : null,
              posterUrl: details.Poster !== 'N/A' ? details.Poster : null,
              popularity: 0,
            });
          } catch (error) {
            console.error(`Error fetching details for ${movie.imdbID}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('OMDb search error:', error);
    }
  }

  if (results.length === 0) {
    return NextResponse.json(
      { error: 'هیچ فیلمی با این نام یافت نشد' },
      { status: 404 }
    );
  }

  // Sort by popularity/relevance
  results.sort((a, b) => b.popularity - a.popularity);

  return NextResponse.json({ success: true, results });
}

