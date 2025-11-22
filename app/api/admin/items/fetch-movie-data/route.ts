import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDecryptedSettings } from '@/lib/settings';
import { uploadImageFromUrl } from '@/lib/object-storage';
import axios from 'axios';

// POST /api/admin/items/fetch-movie-data
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

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

    // Legacy: Single result (for backward compatibility)
    // Step 1: Search on OMDb for IMDb data
    let omdbData = null;
    if (settings.omdbApiKey) {
      omdbData = await fetchFromOMDb(title, settings.omdbApiKey);
    }

    // Step 2: Search on TMDb for better poster image
    let tmdbData = null;
    if (settings.tmdbApiKey) {
      tmdbData = await fetchFromTMDb(title, settings.tmdbApiKey);
    }

    // If neither API is configured
    if (!omdbData && !tmdbData) {
      return NextResponse.json(
        {
          error:
            'لطفاً کلیدهای API را در تنظیمات وارد کنید (OMDb یا TMDb)',
        },
        { status: 500 }
      );
    }

    // Combine data (prefer OMDb for ratings, TMDb for images)
    const combinedData: any = {};

    if (omdbData) {
      combinedData.title = omdbData.Title;
      combinedData.year = omdbData.Year ? parseInt(omdbData.Year) : undefined;
      combinedData.genre = omdbData.Genre?.split(',')[0].trim();
      combinedData.imdbRating = omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : undefined;
      combinedData.plot = omdbData.Plot !== 'N/A' ? omdbData.Plot : undefined;
      combinedData.posterUrl = omdbData.Poster !== 'N/A' ? omdbData.Poster : undefined;
    }

    if (tmdbData) {
      // Override with TMDb data if available
      if (!combinedData.title) combinedData.title = tmdbData.title;
      if (!combinedData.year && tmdbData.release_date) {
        combinedData.year = parseInt(tmdbData.release_date.split('-')[0]);
      }
      if (!combinedData.genre && tmdbData.genres?.length > 0) {
        combinedData.genre = tmdbData.genres[0].name;
      }
      if (!combinedData.plot && tmdbData.overview) {
        combinedData.plot = tmdbData.overview;
      }
      // Use TMDb poster (better quality, no filter)
      if (tmdbData.poster_path) {
        combinedData.posterUrl = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
      }
    }

    // Step 3: Upload poster to Liara Object Storage (if configured)
    let iranianPosterUrl = null;
    if (combinedData.posterUrl) {
      console.log('Uploading poster to Liara...');
      iranianPosterUrl = await uploadImageFromUrl(
        combinedData.posterUrl,
        'movies'
      );
    }

    // Return combined data
    return NextResponse.json({
      title: combinedData.title,
      year: combinedData.year,
      genre: combinedData.genre,
      imdbRating: combinedData.imdbRating,
      plot: combinedData.plot,
      // Use Iranian URL if available, otherwise original
      poster: iranianPosterUrl || combinedData.posterUrl,
      // Flag to show if image is from Iran or foreign
      posterSource: iranianPosterUrl ? 'liara' : 'original',
    });
  } catch (error: any) {
    console.error('Error fetching movie data:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت اطلاعات' },
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

  return NextResponse.json({ results });
}

/**
 * Fetch movie data from OMDb API
 */
async function fetchFromOMDb(title: string, apiKey: string) {
  try {
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}&plot=full`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.Response === 'False') {
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('OMDb API error:', error);
    return null;
  }
}

/**
 * Fetch movie data from TMDb API
 */
async function fetchFromTMDb(title: string, apiKey: string) {
  try {
    // Search for movie
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=en-US`;
    const searchResponse = await axios.get(searchUrl, { timeout: 10000 });

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return null;
    }

    const firstResult = searchResponse.data.results[0];

    // Get full movie details
    const detailsUrl = `https://api.themoviedb.org/3/movie/${firstResult.id}?api_key=${apiKey}&language=en-US`;
    const detailsResponse = await axios.get(detailsUrl, { timeout: 10000 });

    return detailsResponse.data;
  } catch (error) {
    console.error('TMDb API error:', error);
    return null;
  }
}
