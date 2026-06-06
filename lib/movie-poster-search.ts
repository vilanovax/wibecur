import axios from 'axios';
import {
  buildMoviePosterSearchQuery,
  extractEnglishMovieTitle,
} from '@/lib/item-image-search-query';

export type MoviePosterSearchSource = 'imdb' | 'tmdb';

export type MoviePosterSearchResult = {
  id: string;
  source: MoviePosterSearchSource;
  title: string;
  year: number | null;
  posterUrl: string | null;
  rating?: string | number | null;
  genre?: string | null;
};

export type MoviePosterSearchOptions = {
  year?: number | string | null;
  metadata?: Record<string, unknown> | null;
  limit?: number;
};

export function tmdbPosterUrl(
  posterPath: string | null | undefined,
  size: 'w342' | 'w500' | 'original' = 'w500'
): string | null {
  if (!posterPath || typeof posterPath !== 'string') return null;
  const path = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function parseSearchYear(raw?: number | string | null): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 1800 && n <= 2100 ? n : undefined;
}

/** عناوین جایگزین برای جستجو — TMDb/IMDb: اول نام انگلیسی */
export function buildMoviePosterSearchQueries(
  title: string,
  metadata?: Record<string, unknown> | null
): string[] {
  const seen = new Set<string>();
  const queries: string[] = [];

  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, ' ');
    if (t.length < 2) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    queries.push(t);
  };

  const english = buildMoviePosterSearchQuery(title, metadata);
  add(english);

  const stripped = extractEnglishMovieTitle(title, metadata);
  if (stripped !== english) add(stripped);

  for (const sep of [' - ', ' – ', ' — ', ' | ', '|']) {
    if (!title.includes(sep)) continue;
    for (const part of title.split(sep)) {
      const p = part.trim().replace(/^(فیلم\s+و\s+سریال|فیلم|سریال)\s+/iu, '');
      if (p && isMostlyLatinText(p)) add(p);
    }
  }

  return queries;
}

function isMostlyLatinText(s: string): boolean {
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  const persian = (s.match(/[\u0600-\u06FF]/g) || []).length;
  return latin > 0 && latin >= persian;
}

async function tmdbSearchOnce(
  query: string,
  tmdbApiKey: string,
  language: string,
  year?: number
): Promise<MoviePosterSearchResult[]> {
  const yearParam = year ? `&year=${year}` : '';
  const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=${language}&page=1${yearParam}`;
  const response = await axios.get(searchUrl, { timeout: 12000 });

  if (!response.data.results?.length) return [];

  return response.data.results.map(
    (movie: {
      id: number;
      title: string;
      release_date?: string;
      poster_path?: string | null;
      vote_average?: number;
    }) => ({
      id: `tmdb-${movie.id}`,
      source: 'tmdb' as const,
      title: movie.title,
      year: movie.release_date ? parseInt(movie.release_date.split('-')[0], 10) : null,
      posterUrl: tmdbPosterUrl(movie.poster_path),
      rating: movie.vote_average ?? null,
      genre: null,
    })
  );
}

export async function searchTmdbPosters(
  title: string,
  tmdbApiKey: string,
  options?: MoviePosterSearchOptions
): Promise<MoviePosterSearchResult[]> {
  const limit = options?.limit ?? 12;
  const year = parseSearchYear(options?.year ?? options?.metadata?.year);
  const queries = buildMoviePosterSearchQueries(title, options?.metadata);
  const byKey = new Map<string, MoviePosterSearchResult>();

  for (const query of queries) {
    for (const language of ['en-US', 'fa-IR'] as const) {
      const batch = await tmdbSearchOnce(query, tmdbApiKey, language, year);
      for (const item of batch) {
        if (!byKey.has(item.id)) byKey.set(item.id, item);
      }
      if (byKey.size >= limit) break;

      if (year) {
        const batchNoYear = await tmdbSearchOnce(query, tmdbApiKey, language);
        for (const item of batchNoYear) {
          if (!byKey.has(item.id)) byKey.set(item.id, item);
        }
      }
      if (byKey.size >= limit) break;
    }
    if (byKey.size >= limit) break;
  }

  return Array.from(byKey.values())
    .sort((a, b) => {
      if (a.posterUrl && !b.posterUrl) return -1;
      if (!a.posterUrl && b.posterUrl) return 1;
      return 0;
    })
    .slice(0, limit);
}

export async function searchImdbPosters(
  title: string,
  omdbApiKey: string,
  options?: MoviePosterSearchOptions
): Promise<MoviePosterSearchResult[]> {
  const limit = options?.limit ?? 12;
  const queries = buildMoviePosterSearchQueries(title, options?.metadata);
  const byKey = new Map<string, MoviePosterSearchResult>();

  for (const query of queries) {
    const searchUrl = `https://www.omdbapi.com/?apikey=${omdbApiKey}&s=${encodeURIComponent(query)}&type=movie`;
    const response = await axios.get(searchUrl, { timeout: 12000 });

    if (response.data.Response !== 'True' || !response.data.Search?.length) continue;

    for (const movie of response.data.Search.slice(0, limit)) {
      if (byKey.has(`imdb-${movie.imdbID}`)) continue;
      try {
        const detailsUrl = `https://www.omdbapi.com/?apikey=${omdbApiKey}&i=${movie.imdbID}&plot=short`;
        const detailsResponse = await axios.get(detailsUrl, { timeout: 8000 });
        const details = detailsResponse.data;
        if (details.Response === 'False') continue;

        byKey.set(`imdb-${movie.imdbID}`, {
          id: `imdb-${movie.imdbID}`,
          source: 'imdb',
          title: details.Title || movie.Title,
          year: details.Year ? parseInt(String(details.Year).slice(0, 4), 10) : null,
          posterUrl: details.Poster && details.Poster !== 'N/A' ? details.Poster : null,
          rating: details.imdbRating !== 'N/A' ? details.imdbRating : null,
          genre: details.Genre?.split(',')[0]?.trim() || null,
        });
      } catch {
        // skip
      }
      if (byKey.size >= limit) break;
    }
    if (byKey.size >= limit) break;
  }

  return Array.from(byKey.values())
    .sort((a, b) => {
      if (a.posterUrl && !b.posterUrl) return -1;
      if (!a.posterUrl && b.posterUrl) return 1;
      return 0;
    })
    .slice(0, limit);
}
